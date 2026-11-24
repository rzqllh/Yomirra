import { createHash } from "node:crypto";
import { withCache } from "@/server/lib/cache/redis-cache";
import { comicFormat, type MetadataWork } from "@/shared/lib/metadata-catalog";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import { normalizeExternalWorkIds } from "@/shared/lib/external-work-ids";

const ORIGIN = "https://api.mangabaka.org";
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const MAX_MATCHES = 3;
const MAX_DETAIL_LOOKUPS = 2;
const MAX_BYTES = 512 * 1024;
let pausedUntil = 0;
let lastRequestAt = 0;

/** Operator must verify permitted data use before enabling in an environment.
 * No credentials needed; no nested third-party source data is imported.
 */
export function isMangaBakaEnabled(): boolean {
  return process.env.YOMIRRA_MANGABAKA_METADATA === "permitted";
}

type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;
}

export function parseMangaBakaWork(value: unknown, allRatings = false): MetadataWork | null {
  const row = record(value);
  if (!row || typeof row.id !== "number" || !Number.isSafeInteger(row.id) || row.id <= 0 ||
      row.state !== "active" || !Array.isArray(row.titles)) return null;
  const rating = row.content_rating;
  if (rating !== "safe" && (!allRatings || (rating !== "suggestive" && rating !== "erotica" && rating !== "pornographic"))) return null;
  const format = comicFormat(typeof row.type === "string" ? row.type : undefined);
  if (!format) return null;
  const titles = row.titles.flatMap(value => {
    const t = record(value);
    return t && typeof t.title === "string" && t.title.trim() && t.title.length <= 1000
      ? [{ title: t.title.trim(), language: t.language, primary: t.is_primary === true }] : [];
  });
  if (!titles.length) return null;
  const preferred = titles.find(t => t.primary && t.language === "en") ??
    titles.find(t => t.primary) ?? titles[0];
  const externalWorkIds = normalizeExternalWorkIds(row.source_ids);
  return {
    ...(externalWorkIds ? { externalWorkIds } : {}),
    provider: "mangabaka",
    externalId: row.id,
    format,
    contentRating: rating,
    title: preferred.title,
    aliases: [...new Set(titles.map(t => t.title))],
  };
}

async function request(path: string, followup = false): Promise<unknown> {
  if (followup && Date.now() - lastRequestAt < 400) {
    await new Promise<void>(resolve => setTimeout(resolve, 400 - (Date.now() - lastRequestAt)));
  }
  const now = Date.now();
  // Per-instance pacing complements the existing route's admission limit.
  // Fail open to provider results rather than queue/retry and amplify traffic.
  if (now < pausedUntil || now - lastRequestAt < 400) throw new Error("Metadata pacing");
  lastRequestAt = now;
  const response = await fetch(new URL(path, ORIGIN), {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(2500),
    cache: "no-store",
  });
  if (response.status === 429) {
    const retry = Number(response.headers.get("Retry-After"));
    pausedUntil = Date.now() + (Number.isFinite(retry) && retry > 0 ? retry * 1000 : 60_000);
  }
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("Metadata API unavailable");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) throw new Error("Metadata response exceeds limit");
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const parsed = record(JSON.parse(body));
  if (!parsed || parsed.status !== 200 || !("data" in parsed)) throw new Error("Metadata schema mismatch");
  return parsed.data;
}

/** One title lookup and at most two bounded detail requests per cache miss.
 * No per-card harvesting, pagination or retries. Only full v2 title records
 * are used. Ambiguity or partial failures leave the original results intact.
 */
export async function matchMangaBakaWorks(query: string, allRatings = false): Promise<MetadataWork[]> {
  if (!isMangaBakaEnabled()) return [];
  const q = query.trim().normalize("NFKC");
  if (q.length < 3 || q.length > 160 || !normalizeTitle(q)) return [];
  const key = "metadata:mangabaka:v4:" + (allRatings ? "classification:" : "match:") + createHash("sha256").update(q).digest("hex");
  try {
    return await withCache(key, async () => {
      const data = await request("/v2/series/match?" + new URLSearchParams({ q }).toString());
      if (!Array.isArray(data)) throw new Error("Metadata match schema mismatch");
      // A broad or ambiguous search must not silently pick a top result.
      if (data.length > MAX_MATCHES) return [];
      const works: MetadataWork[] = [];
      let detailLookups = 0;
      for (const candidate of data) {
        const row = record(candidate);
        if (!row || typeof row.id !== "number" || !Number.isSafeInteger(row.id) || row.id <= 0 ||
            typeof row.type !== "string") return [];
        // Novel/adaptation records are never eligible in the comic projection.
        if (!comicFormat(row.type)) continue;
        // A restricted candidate sharing an alias is a reason not to collapse
        // the result, even if another candidate appears safe.
        if (!allRatings && row.content_rating !== "safe") return [];
        let work = parseMangaBakaWork(row, allRatings);
        if (!work) {
          if (++detailLookups > MAX_DETAIL_LOOKUPS) return [];
          const detail = await request(`/v2/series/${row.id}?schema=full`, true);
          work = parseMangaBakaWork(detail, allRatings);
        }
        if (!work || work.externalId !== row.id || work.format !== comicFormat(row.type) || work.contentRating !== row.content_rating) return [];
        // /match accepts phrase fragments; require the user's complete title
        // to be present as an alias before any automatic projection.
        if (work.aliases.some(title => normalizeTitle(title) === normalizeTitle(q))) {
          works.push(work);
        }
      }
      return works;
    }, CACHE_TTL_SECONDS, { allowStaleOnError: false });
  } catch {
    return [];
  }
}
