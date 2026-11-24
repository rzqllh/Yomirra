import { createHmac, timingSafeEqual } from "node:crypto";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { rasterImageContentType } from "@/shared/lib/raster-image";
import { env } from "@/env";
import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import { classifyContent } from "@/shared/sources/content-policy";
import type { MangaItem } from "@/shared/sources/source-types";
import { getStagedKeiyoushiSource } from "./adapters/keiyoushi";

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

export async function readPrivateBetaCatalog(id: string, query: string) {
  const adapter = authorizedAdapter(id);
  const result = query ? await adapter.search(query, 1, undefined, options) : await adapter.getPopular(1, options);
  if (!Array.isArray(result?.mangas)) throw new Error("PRIVATE_BETA_SCHEMA_CHANGED");
  const rows = result.mangas.filter((m: MangaItem) =>
    m && typeof m.id === "string" && typeof m.title === "string" &&
    validBetaIdentity(m.id) && !m.id.includes("/") && m.title.trim() && classifyContent(m) === "SAFE"
  ).slice(0, 24).map(m => ({ id: m.id.slice(0, 300), title: m.title.slice(0, 300), format: m.format?.slice(0, 40) }));
  return { items: rows, received: result.mangas.length };
}

/** Only proven safe detail and explicitly unlocked chapters may be opened.
 * Never accept an upstream URL as a user-supplied identity. */
export async function readPrivateBetaDetail(id: string, mangaId: string) {
  if (!validBetaIdentity(mangaId) || mangaId.includes("/")) throw new Error("PRIVATE_BETA_INVALID_ID");
  const adapter = authorizedAdapter(id);
  const detail = await adapter.getDetail(mangaId, options);
  if (!detail || detail.id !== mangaId || typeof detail.title !== "string" ||
      !detail.title.trim() || classifyContent(detail) !== "SAFE") throw new Error("PRIVATE_BETA_DETAIL_UNAVAILABLE");
  const chapters = await adapter.getChapters(mangaId, options);
  if (!Array.isArray(chapters)) throw new Error("PRIVATE_BETA_SCHEMA_CHANGED");
  return {
    title: detail.title.slice(0,300),
    chapters: chapters.filter(ch => ch && ch.mangaId === mangaId && validBetaIdentity(ch.id) &&
      typeof ch.title === "string" && ch.title.trim())
      .slice(0,500).map(ch => ({ id: ch.id, title: ch.title.slice(0,200), readable: ch.isLocked === false })),
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
