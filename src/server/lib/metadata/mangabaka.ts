import { createHash } from "node:crypto";
import { withCache } from "@/server/lib/cache/redis-cache";
import { comicFormat, type MetadataWork } from "@/shared/lib/metadata-catalog";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import type { ExternalWorkIds } from "@/shared/sources/source-types";
import { compareExternalWorkIds, normalizeExternalWorkIds } from "@/shared/lib/external-work-ids";
import { parseCatalogRecord } from "./mangabaka-record.mjs";
import { findLocalMetadataWorks,getLocalMetadataWork } from "./local-catalog-index";
import { isTursoCatalogEnabled, lookupTursoCatalog, getTursoMetadataWork } from "./turso-catalog";

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
  // Live v2 full records provide titles and authors. Keep API parsing strict;
  // the v1 title fallback is only for the offline dump importer.
  if (!Array.isArray(record(value)?.titles)) return null;
  return parseCatalogRecord(value,allRatings);
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
export async function matchMangaBakaWorks(query: string, allRatings = false, externalWorkIds?:ExternalWorkIds): Promise<MetadataWork[]> {
  if (!isMangaBakaEnabled()) return [];
  const q = query.trim().normalize("NFKC");
  if (q.length < 3 || q.length > 160 || !normalizeTitle(q)) return [];
  const ids=normalizeExternalWorkIds(externalWorkIds);
  const local=findLocalMetadataWorks({titles:[q],externalWorkIds:ids});
  if(local!==null) {
    if(local.length>MAX_MATCHES || (!allRatings && local.some(work=>work.contentRating!=="safe")))return [];
    return local;
  }
  if(isTursoCatalogEnabled()){
    const remote=await lookupTursoCatalog(q,ids);
    // Optional metadata outage never creates a second unbudgeted request.
    if(!remote||remote.works.length>MAX_MATCHES||(!allRatings&&remote.works.some(w=>w.contentRating!=="safe")))return [];
    return remote.works;
  }
  // Documented ID endpoints are preferable to fuzzy title lookups. An
  // unresolved or contradictory tracker never falls back to title matching.
  if(ids)return lookupMangaBakaIds(q,ids,allRatings);
  const key = "metadata:mangabaka:v6:" + (allRatings ? "classification:" : "match:") + createHash("sha256").update(q).digest("hex");
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
        const ids=normalizeExternalWorkIds(row.source_ids);
        if(compareExternalWorkIds(ids,work.externalWorkIds)==="conflict")return [];
        if(ids)work={...work,externalWorkIds:{...ids,...work.externalWorkIds}};
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

export async function getPublicMetadataWork(id:number):Promise<MetadataWork|null>{
  if(!isMangaBakaEnabled()||!Number.isSafeInteger(id)||id<=0)return null;
  const local=getLocalMetadataWork(id);
  if(local)return local;
  if(isTursoCatalogEnabled())return getTursoMetadataWork(id);
  try{return await withCache("metadata:mangabaka:v5:detail:"+id,async()=>{
    const work=parseMangaBakaWork(await request(`/v2/series/${id}?schema=full`));
    return work?.externalId===id?work:null;
  },CACHE_TTL_SECONDS,{allowStaleOnError:false});}catch{return null;}
}

const ID_PATHS={anilist:"anilist",my_anime_list:"my-anime-list",manga_updates:"manga-updates"} as const;
async function lookupMangaBakaIds(title:string,ids:ExternalWorkIds,allRatings:boolean):Promise<MetadataWork[]>{
  const keys=(Object.keys(ID_PATHS) as Array<keyof ExternalWorkIds>).filter(key=>ids[key]);
  const scope=JSON.stringify(keys.map(key=>[key,ids[key]]));
  const cacheKey="metadata:mangabaka:v6:ids:"+createHash("sha256").update(JSON.stringify([title,scope,allRatings])).digest("hex");
  try{
    return await withCache(cacheKey,async()=>{
      let id:number|undefined;
      // At most three explicit tracker lookups plus one full series record.
      // Never use this function for bulk catalogue discovery.
      for(const key of keys){
        const data=record(await request("/v1/source/"+ID_PATHS[key]+"/"+encodeURIComponent(ids[key]!),id!==undefined));
        if(!Array.isArray(data?.series)||data.series.length!==1)return [];
        const match=record(data.series[0]);
        if(!match||typeof match.id!=="number"||!Number.isSafeInteger(match.id)||match.id<=0||
           (match.state!==undefined&&match.state!=="active")||(id!==undefined&&id!==match.id))return [];
        id=match.id;
      }
      if(id===undefined)return [];
      const work=parseMangaBakaWork(await request("/v2/series/"+id+"?schema=full",true),allRatings);
      if(!work||work.externalId!==id||compareExternalWorkIds(ids,work.externalWorkIds)==="conflict")return [];
      // Even an exact mapping does not make an unrelated supplied title
      // evidence for the provider edition.
      if(!work.aliases.some(alias=>normalizeTitle(alias)===normalizeTitle(title)))return [];
      return [{...work,externalWorkIds:{...work.externalWorkIds,...ids}}];
    },CACHE_TTL_SECONDS,{allowStaleOnError:false});
  }catch{return [];}
}
