import { createHmac, timingSafeEqual } from "node:crypto";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { rasterImageContentType } from "@/shared/lib/raster-image";
import { env } from "@/env";
import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import { classifyContent } from "@/shared/sources/content-policy";
import type { MangaItem } from "@/shared/sources/source-types";
import { getStagedKeiyoushiSource } from "./adapters/keiyoushi";
import { matchMangaBakaWorks } from "@/server/lib/metadata/mangabaka";
import { inheritCanonicalRating, matchCanonicalMetadata } from "@/shared/lib/metadata-catalog";
import { applyLocalCanonicalMetadata } from "@/server/lib/metadata/local-catalog-index";

/** Only non-restricted, implemented candidates may be considered for private
 * metadata testing. No duplicate, DRM, login/paywall prototype or explicit
 * content adapter may be enabled by an environment variable.
 */
const supported = new Set(["manhwa-list", "izanamiscans", "ainzscansid", "soul-scans"]);

export function privateBetaSources(approved = process.env.YOMIRRA_PRIVATE_BETA_SOURCE_IDS ?? "") {
  const allowed = new Set(approved.split(",").map(id => id.trim()).filter(Boolean));
  return KEIYOUSHI_CANDIDATES.filter(c => c.category === "SFW" && supported.has(c.id)).map(c => ({
    id: c.id, name: c.name, available: allowed.has(c.id),
  }));
}

export function privateBetaAllowsSource(id: string): boolean {
  return privateBetaSources().some(source => source.id === id && source.available);
}

/** Keep this data out of public search, Redis catalog, history, downloads,
 * public image proxy and service worker caches. The private reader below
 * uses separate account-bound image tickets.
 */
function authorizedAdapter(id: string) {
  if (!privateBetaAllowsSource(id)) throw new Error("PRIVATE_BETA_SOURCE_UNAVAILABLE");
  const adapter = getStagedKeiyoushiSource(id);
  if (!adapter || adapter.id !== id || adapter.isNsfw || adapter.isEnabled) throw new Error("PRIVATE_BETA_SOURCE_UNAVAILABLE");
  return adapter;
}
const options = { hideNsfw: true, preferredLanguages: ["id", "en"] };

export function validBetaIdentity(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 300 &&
    value.split("/").every(part => /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(part) && part !== "." && part !== "..");
}

/** Only the generic SFW adapter's known series routes may contain a
 * slash. Never authorize an arbitrary same-host endpoint as a manga ID. */
function validBetaMangaId(sourceId: string, value: unknown): value is string {
  if (!validBetaIdentity(value)) return false;
  return !value.includes("/") || (sourceId === "soul-scans" &&
    /^(comic|series|komik)\/[A-Za-z0-9_-][A-Za-z0-9_.-]{0,199}$/.test(value));
}

export type PrivateBetaCatalogMode = "popular" | "latest" | "search";
export const PRIVATE_BETA_MAX_PAGE = 20;

export async function readPrivateBetaCatalog(
  id: string, query: string, page = 1, mode: PrivateBetaCatalogMode = query.trim() ? "search" : "popular",
) {
  if (!Number.isSafeInteger(page) || page < 1 || page > PRIVATE_BETA_MAX_PAGE ||
      !["popular","latest","search"].includes(mode) || query.length > 160 ||
      (mode === "search" ? !query.trim() : Boolean(query.trim()))) {
    throw new Error("PRIVATE_BETA_INVALID_CATALOG_REQUEST");
  }
  const adapter = authorizedAdapter(id);
  const result = mode === "search" ? await adapter.search(query.trim(), page, undefined, options) :
    mode === "latest" ? await adapter.getLatest(page, options) : await adapter.getPopular(page, options);
  if (!Array.isArray(result?.mangas) || typeof result.hasNextPage !== "boolean") throw new Error("PRIVATE_BETA_SCHEMA_CHANGED");
  // No request per listing item. Only an explicit title search may supply
  // canonical evidence, and only strong identity can inherit its rating.
  const works = mode === "search" ? await matchMangaBakaWorks(query.trim(),true) : [];
  const normalized = result.mangas.map(m => m && applyLocalCanonicalMetadata(inheritCanonicalRating(m,matchCanonicalMetadata(m,works))));
  const rows = normalized.filter((m: MangaItem) =>
    m && typeof m.id === "string" && typeof m.title === "string" &&
    validBetaMangaId(id, m.id) && m.title.trim() && classifyContent(m) === "SAFE"
  ).slice(0, 24).map(m => ({ id: m.id.slice(0, 300), title: m.title.slice(0, 300), format: m.format?.slice(0, 40) }));
  return { items: rows, received: result.mangas.length, page, hasNextPage: page < PRIVATE_BETA_MAX_PAGE && result.hasNextPage };
}

/** Only proven safe detail and explicitly unlocked chapters may be opened.
 * Never accept an upstream URL as a user-supplied identity. */
export async function readPrivateBetaDetail(id: string, mangaId: string) {
  if (!validBetaMangaId(id, mangaId)) throw new Error("PRIVATE_BETA_INVALID_ID");
  const adapter = authorizedAdapter(id);
  const rawDetail = await adapter.getDetail(mangaId, options);
  if (!rawDetail || rawDetail.id !== mangaId || typeof rawDetail.title !== "string" ||
      !rawDetail.title.trim() || classifyContent(rawDetail) === "NSFW") throw new Error("PRIVATE_BETA_DETAIL_UNAVAILABLE");
  const local=applyLocalCanonicalMetadata(rawDetail);
  // A provider safe label must not override stronger restrictive canonical evidence.
  const works = await matchMangaBakaWorks(rawDetail.title,true,rawDetail.externalWorkIds);
  const detail = inheritCanonicalRating(local,matchCanonicalMetadata(local,works));
  if (classifyContent(detail) !== "SAFE") throw new Error("PRIVATE_BETA_DETAIL_UNAVAILABLE");
  const chapters = await adapter.getChapters(mangaId, options);
  if (!Array.isArray(chapters)) throw new Error("PRIVATE_BETA_SCHEMA_CHANGED");
  const identities = new Map<string, { id: string; title: string; readable: boolean }>();
  // Check every row before truncating; a conflicting later entry must not
  // leave an earlier unlocked entry readable.
  for (const ch of chapters) {
    if (!ch || ch.mangaId !== mangaId || !validBetaIdentity(ch.id) ||
        typeof ch.title !== "string" || !ch.title.trim()) continue;
    const entry = { id: ch.id, title: ch.title.trim(), readable: ch.isLocked === false };
    const previous = identities.get(ch.id);
    if (previous && (previous.title !== entry.title || previous.readable !== entry.readable)) {
      throw new Error("PRIVATE_BETA_SCHEMA_CHANGED");
    }
    if (!previous) identities.set(ch.id, entry);
  }
  return {
    title: detail.title.slice(0,300),
    chapters: [...identities.values()].slice(0,500).map(ch => ({...ch,title:ch.title.slice(0,200)})),
  };
}

type PageTicket = { uid: string; source: string; url: string; exp: number };
const TICKET_TTL = 15 * 60;
function safePageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash;
  } catch { return false; }
}
function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update("yomirra-private-beta-page-v1:").update(payload).digest();
}
function issuePageTicket(ticket: PageTicket): string {
  const secret = env.IMAGE_PROXY_SECRET;
  if (!secret) throw new Error("PRIVATE_BETA_IMAGE_UNCONFIGURED");
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return payload + "." + signature(payload,secret).toString("hex");
}
export function verifyBetaPageTicket(ticket: string, uid: string): PageTicket | null {
  const secret = env.IMAGE_PROXY_SECRET;
  if (!secret || typeof ticket !== "string" || ticket.length > 4096) return null;
  const [payload, sig, extra] = ticket.split(".");
  if (!payload || !sig || extra !== undefined || !/^[a-f0-9]{64}$/.test(sig) || !/^[A-Za-z0-9_-]+$/.test(payload)) return null;
  if (!timingSafeEqual(signature(payload,secret),Buffer.from(sig,"hex"))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as PageTicket;
    if (data.uid !== uid || !privateBetaAllowsSource(data.source) || !safePageUrl(data.url) ||
        !Number.isSafeInteger(data.exp) || data.exp <= Math.floor(Date.now()/1000)) return null;
    return data;
  } catch { return null; }
}

export async function readPrivateBetaChapter(uid: string, id: string, mangaId: string, chapterId: string) {
  if (!validBetaIdentity(chapterId)) throw new Error("PRIVATE_BETA_INVALID_ID");
  const detail = await readPrivateBetaDetail(id,mangaId);
  const chapter = detail.chapters.find(ch => ch.id === chapterId);
  if (!chapter?.readable) throw new Error("PRIVATE_BETA_CHAPTER_UNAVAILABLE");
  const adapter = authorizedAdapter(id);
  if (!env.IMAGE_PROXY_SECRET) throw new Error("PRIVATE_BETA_IMAGE_UNCONFIGURED");
  const result = await adapter.getPages(chapterId,{...options,mangaId});
  if (!result || result.chapterId !== chapterId || !Array.isArray(result.pages) ||
      result.pages.length === 0 || result.pages.length > 300 ||
      result.pages.some(p => !p || !safePageUrl(p.url))) throw new Error("PRIVATE_BETA_PAGES_UNAVAILABLE");
  return {
    title: chapter.title,
    pages: result.pages.map(p => issuePageTicket({uid,source:id,url:p.url,exp:Math.floor(Date.now()/1000)+TICKET_TTL})),
  };
}

/** No cookies, forged referers, redirects or CDN bypass. The outbound
 * policy performs DNS/IP checks and bounds response size. */
export async function fetchPrivateBetaPage(ticket: string, uid: string, signal: AbortSignal): Promise<Response | null> {
  const page = verifyBetaPageTicket(ticket,uid);
  if (!page) return null;
  const upstream = await safeFetch(page.url,{maxRedirects:0,maxSize:10*1024*1024,signal:AbortSignal.any([signal,AbortSignal.timeout(10000)])});
  const type = rasterImageContentType(upstream);
  if (!upstream.ok || !type || !upstream.body) {
    await upstream.body?.cancel();
    return null;
  }
  return new Response(upstream.body,{headers:{
    "Content-Type":type,"Cache-Control":"private, no-store, max-age=0",
    "Vercel-CDN-Cache-Control":"no-store","CDN-Cache-Control":"no-store",
    "Vary":"Authorization","X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"sandbox; default-src 'none'",
    "X-Robots-Tag":"noindex, nofollow",
  }});
}
