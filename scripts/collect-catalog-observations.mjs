// Bounded public metadata observation, not a cross-provider benchmark.
// Official MangaDex API: https://api.mangadex.org/docs/
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const LIMIT = 100;
const MAX_REQUESTS = 4;
const TARGET = 300;
const MAX_BYTES = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const format = { ja:"manga", ko:"manhwa", zh:"manhua", "zh-hk":"manhua" };

async function readBoundedJson(response) {
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("HTTP_" + response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("RESPONSE_LIMIT");
      text += decoder.decode(value,{stream:true});
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally {
    await reader.cancel().catch(()=>undefined);
    reader.releaseLock();
  }
}

export function readObservation(row) {
  const a = row?.attributes;
  if (row?.type !== "manga" || typeof row.id !== "string" || !uuid.test(row.id) ||
      a?.contentRating !== "safe" || !a.title || typeof a.title !== "object") return null;
  const title = [a.title.en,a.title.ja,a.title["ja-ro"],...Object.values(a.title)]
    .find(v=>typeof v==="string" && v.trim() && v.length<=300)?.trim();
  if (!title || !Object.hasOwn(format,a.originalLanguage)) return null;
  const links = {};
  for (const [from,to] of [["al","anilist"],["mal","my_anime_list"],["mu","manga_updates"]]) {
    const value = a.links?.[from];
    if (typeof value === "string" && (from==="mu" ? /^(?=[a-z0-9]{1,32}$)(?=.*[a-z])[a-z0-9]+$/i : /^[1-9]\d{0,14}$/).test(value)) links[to]=value.toLowerCase();
  }
  const authors=[...new Set((Array.isArray(row.relationships)?row.relationships:[]).filter(r=>r?.type==="author").map(r=>r.attributes?.name).filter(v=>typeof v==="string"&&v.trim()&&v.length<=300).map(v=>v.trim()))].slice(0,20);
  const aliases=[...new Set([title,...Object.values(a.title),...(Array.isArray(a.altTitles)?a.altTitles.flatMap(v=>v&&typeof v==="object"?Object.values(v):[]):[])].filter(v=>typeof v==="string"&&v.trim()&&v.length<=300).map(v=>v.trim()))].slice(0,100);
  return {sourceId:"mangadex",id:row.id,title,aliases,authors,formatHint:format[a.originalLanguage],
    originalLanguage:a.originalLanguage,contentRating:"safe",externalWorkIds:links,
    evidence:"https://mangadex.org/title/"+row.id};
}

export async function collectObservations({fetchImpl=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),sha=process.env.EVIDENCE_HEAD_SHA??null}={}) {
  const rows = new Map();
  const attempts = [];
  const report = {schemaVersion:1,kind:"single-provider-observation",source:"MangaDex",headSha:sha,
    observedAt:new Date().toISOString(),target:TARGET,requests:attempts,rows:[],status:"INCOMPLETE",
    independentlyReviewedCrossProviderWorks:0,benchmarkPass:false};
  let offset=0;
  try {
    for (let i=0;i<MAX_REQUESTS && rows.size<TARGET;i++) {
      if (i) await sleep(1200);
      const url = new URL("https://api.mangadex.org/manga");
      url.search = new URLSearchParams({limit:String(LIMIT),offset:String(offset),"contentRating[]":"safe","includes[]":"author","order[followedCount]":"desc"}).toString();
      const attempt = {offset,status:null};
      attempts.push(attempt);
      const response = await fetchImpl(url,{redirect:"error",cache:"no-store",signal:AbortSignal.timeout(8000),
        headers:{Accept:"application/json","User-Agent":"Yomirra-Catalog-Evidence/1.0 (https://github.com/rzqllh/Yomirra)"}});
      attempt.status=response.status;
      const body=await readBoundedJson(response);
      if (body?.result!=="ok" || !Array.isArray(body.data) || body.data.length>LIMIT || body.offset!==offset || !Number.isSafeInteger(body.total)) throw new Error("SCHEMA_CHANGED");
      attempt.returned=body.data.length;
      let added=0;
      for (const item of body.data) {
        const row=readObservation(item);
        if (row && !rows.has(row.id)) {rows.set(row.id,row);added++;}
      }
      attempt.accepted=added;
      offset+=body.data.length;
      if (!body.data.length || !added || offset>=body.total) break;
    }
    report.status=rows.size>=TARGET?"OBSERVATIONS_COLLECTED":"INSUFFICIENT_OBSERVATIONS";
  } catch(error) {report.status="UPSTREAM_UNVERIFIED";report.failure=error instanceof Error?error.message.slice(0,180):"Unknown error";}
  report.rows=[...rows.values()].slice(0,TARGET);
  report.count=report.rows.length;
  return report;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const report=await collectObservations();
  await mkdir("artifacts",{recursive:true});
  await writeFile("artifacts/catalog-live-observations.json",JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({status:report.status,count:report.count,requests:report.requests,failure:report.failure,benchmarkPass:false}));
  if(report.status!=="OBSERVATIONS_COLLECTED") process.exitCode=1;
}
