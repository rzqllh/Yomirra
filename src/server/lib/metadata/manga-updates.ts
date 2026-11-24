import { withCache } from "@/server/lib/cache/redis-cache";
import { comicFormat } from "@/shared/lib/metadata-catalog";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import { normalizeExternalWorkIds } from "@/shared/lib/external-work-ids";
import { mangaUpdatesNumericId, type MangaUpdatesReference } from "@/shared/lib/manga-updates-reference";
import { classifyContent } from "@/shared/sources/content-policy";
import type { MangaDetail } from "@/shared/types/source";

const TTL = 24 * 60 * 60;
const MAX_BYTES = 256 * 1024;
let nextRequestAt = 0;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function parseMangaUpdatesReference(value: unknown, id: string): MangaUpdatesReference | null {
  const row = record(value);
  const numeric = mangaUpdatesNumericId(id);
  if (!row || numeric === null || row.series_id !== numeric || typeof row.title !== "string" ||
      !row.title.trim() || row.title.length > 300 || typeof row.url !== "string") return null;
  const format = comicFormat(typeof row.type === "string" ? row.type : undefined);
  if (!format) return null;
  try {
    const url = new URL(row.url);
    if (url.protocol !== "https:" || !["www.mangaupdates.com", "mangaupdates.com"].includes(url.hostname) ||
        url.username || url.password || url.port || url.pathname.split("/")[1] !== "series" ||
        url.pathname.split("/")[2] !== id) return null;
  } catch { return null; }
  return { id, title: row.title.trim(), format };
}

async function fetchReference(id: string, numeric: number): Promise<MangaUpdatesReference> {
  const now = Date.now();
  // No queue, retries, pagination or per-card harvesting.
  if (now < nextRequestAt) throw new Error("Metadata request pacing");
  nextRequestAt = now + 1000;
  const response = await fetch("https://api.mangaupdates.com/v1/series/" + numeric, {
    headers: { Accept: "application/json" }, redirect: "error",
    cache: "no-store", signal: AbortSignal.timeout(2000),
  });
  if (response.status === 429) {
    const raw = response.headers.get("Retry-After");
    const seconds = raw && /^\d+$/.test(raw) ? Number(raw) : NaN;
    const until = raw && Number.isNaN(seconds) ? Date.parse(raw) : NaN;
    nextRequestAt = Math.max(nextRequestAt, Number.isFinite(seconds) ? Date.now() + seconds * 1000 :
      Number.isFinite(until) ? until : Date.now() + 60_000, Date.now() + 1000);
  }
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("Metadata API unavailable");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "", bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("Metadata response too large");
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const item = parseMangaUpdatesReference(JSON.parse(body), id);
  if (!item) throw new Error("Metadata identity or schema mismatch");
  return item;
}

/** Verify only a trusted provider's existing MangaUpdates reference.
 * No title search, content/rating override, automatic global binding, or
 * account data. Operator must establish permitted use before enabling. */
export async function loadMangaUpdatesReference(sourceId: string, detail: MangaDetail): Promise<MangaUpdatesReference | null> {
  if (process.env.YOMIRRA_MANGAUPDATES_METADATA !== "permitted" || sourceId !== "mangadex" ||
      classifyContent(detail) !== "SAFE") return null;
  const id = normalizeExternalWorkIds(detail.externalWorkIds)?.manga_updates;
  const numeric = mangaUpdatesNumericId(id);
  const format = comicFormat(detail.format);
  if (!id || numeric === null || !format) return null;
  try {
    const reference = await withCache("metadata:manga-updates:v1:" + id,
      () => fetchReference(id, numeric), TTL, { allowStaleOnError: false });
    if (reference.id !== id || reference.format !== format) return null;
    // Known ID alone must not label a different title as equivalent. Only show
    // the metadata reference where a provider-supplied alias also agrees.
    const names = [detail.title, detail.originalTitle, ...(detail.alternativeTitles ?? [])]
      .map(normalizeTitle).filter(Boolean);
    return names.includes(normalizeTitle(reference.title)) ? reference : null;
  } catch { return null; }
}
