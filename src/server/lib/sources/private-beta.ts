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
 * image proxy and service worker caches. Never resolve page/image URLs.
 */
export async function readPrivateBetaCatalog(id: string, query: string) {
  if (!privateBetaAllowsSource(id)) throw new Error("PRIVATE_BETA_SOURCE_UNAVAILABLE");
  const adapter = getStagedKeiyoushiSource(id);
  if (!adapter || adapter.id !== id || adapter.isNsfw || adapter.isEnabled) throw new Error("PRIVATE_BETA_SOURCE_UNAVAILABLE");
  const options = { hideNsfw: true, preferredLanguages: ["id", "en"] };
  const result = query ? await adapter.search(query, 1, undefined, options) : await adapter.getPopular(1, options);
  if (!Array.isArray(result?.mangas)) throw new Error("PRIVATE_BETA_SCHEMA_CHANGED");
  const rows = result.mangas.filter((m: MangaItem) =>
    m && typeof m.id === "string" && typeof m.title === "string" &&
    m.id.trim() && m.title.trim() && classifyContent(m) === "SAFE"
  ).slice(0, 24).map(m => ({ id: m.id.slice(0, 300), title: m.title.slice(0, 300), format: m.format?.slice(0, 40) }));
  return { items: rows, received: result.mangas.length };
}
