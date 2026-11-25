import {createHash} from "node:crypto";
import {withCache} from "@/server/lib/cache/redis-cache";
import {normalizeTitle} from "@/shared/lib/title-matcher";
import {normalizeExternalWorkIds} from "@/shared/lib/external-work-ids";
import type {ExternalWorkIds,MangaItem} from "@/shared/sources/source-types";
import {comicFormat} from "@/shared/lib/metadata-catalog";
import type {MetadataWork} from "@/shared/lib/metadata-catalog";
import {decodeCatalogPayload} from "./catalog-payload.mjs";
import {reserveCatalogRequest} from "./catalog-budget";
import {currentTursoCatalog,isTursoCatalogConfigured} from "./catalog-pointer";
import type {CatalogSlot as Config} from "./catalog-slots.mjs";

const MAX_RESPONSE=2*1024*1024;
const MAX_AGE=7*86400000;
let pausedUntil=0;
type Query={sql:string;args:string[];maxRows:number};
type PipelineValue={type:string;value?:string;base64?:string};
export function isTursoCatalogEnabled(){return isTursoCatalogConfigured();}
function textCell(cell:PipelineValue):string{
  if(cell?.type!=="text"||typeof cell.value!=="string")throw Error("Invalid catalog cell");
  return cell.value;
}
function payload(cell:PipelineValue):MetadataWork{
  if(cell?.type==="text")return decodeCatalogPayload(textCell(cell));
  if(cell?.type!=="blob"||typeof cell.base64!=="string"||cell.base64.length>90000)throw Error("Invalid catalog payload");
  return decodeCatalogPayload(Buffer.from(cell.base64,"base64"));
}
async function request(c:Config,queries:Query[]):Promise<PipelineValue[][][]>{
  if(Date.now()<pausedUntil)throw Error("Catalog temporarily paused");
  if(!await reserveCatalogRequest())throw Error("Catalog admission unavailable");
  const response=await fetch(c.origin+"/v2/pipeline",{
    method:"POST",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(2500),
    headers:{Authorization:"Bearer "+c.token,"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({requests:[...queries.map(q=>({type:"execute",stmt:{sql:q.sql,args:q.args.map(value=>({type:"text",value}))}})),{type:"close"}]}),
  });
  if(!response.ok||!response.body){
    pausedUntil=Date.now()+(response.status===429?60000:15000);
    await response.body?.cancel();
    throw Error("Catalog service unavailable");
  }
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let size=0,body="";
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>MAX_RESPONSE)throw Error("Catalog response exceeds limit");
      body+=decoder.decode(value,{stream:true});}
    body+=decoder.decode();
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  const value=JSON.parse(body);
  if(!Array.isArray(value?.results)||value.results.length!==queries.length+1||
     value.results.at(-1)?.type!=="ok"||value.results.at(-1)?.response?.type!=="close")throw Error("Catalog protocol mismatch");
  return queries.map((q,i)=>{
    const entry=value.results[i],rows=entry?.response?.result?.rows;
    if(entry?.type!=="ok"||entry.response.type!=="execute"||!Array.isArray(rows)||rows.length>q.maxRows||
       rows.some((row:unknown)=>!Array.isArray(row)))throw Error("Catalog query failed");
    return rows as PipelineValue[][];
  });
}
const manifest:Query={sql:"SELECT CAST(schema_version AS TEXT), created_at, license, provider, source_sha256 FROM manifest LIMIT 2",args:[],maxRows:2};
function validateManifest(rows:PipelineValue[][],snapshot:string){
  if(rows.length!==1||rows[0].length!==5)throw Error("Catalog manifest missing");
  const [version,created,license,provider,sha]=rows[0].map(textCell);
  const at=Date.parse(created),now=Date.now();
  if(version!=="2"||license!=="CC-BY-NC-SA-4.0"||provider!=="mangabaka"||sha!==snapshot||
     !Number.isFinite(at)||at>now||now-at>MAX_AGE)throw Error("Catalog snapshot invalid or expired");
  return at;
}
type CatalogResult={works:MetadataWork[];discovery:MetadataWork[]};
async function cachedQuery<T>(c:Config,queries:Query[],parse:(rows:PipelineValue[][][])=>T,scope=""):Promise<T>{
  const key="metadata:turso:v1:"+createHash("sha256").update(JSON.stringify([c.origin,c.snapshot,queries])).digest("hex");
  // Strict cache TTL for classification. No stale safety rating on errors.
  const cached=await withCache(key+":manifest-v2"+scope,async()=>{
    const [m,...rows]=await request(c,[manifest,...queries]);
    const createdAt=validateManifest(m,c.snapshot);
    return {createdAt,result:parse(rows)};
  },1800,{allowStaleOnError:false,shouldPersist:data=>JSON.stringify(data).length<=64*1024});
  const now=Date.now();
  if(!Number.isFinite(cached?.createdAt)||cached.createdAt>now||now-cached.createdAt>MAX_AGE)throw Error("Catalog snapshot expired");
  return cached.result;
}
/** Explicit search/detail only; one bounded pipeline, no per-cover fan-out.
 * Returns null for unavailable; empty results remain distinct from an outage. */
export async function lookupTursoCatalog(query:string,externalIds?:ExternalWorkIds,includeDiscovery=false):Promise<CatalogResult|null>{
  const title=normalizeTitle(query);
  if(title.length<3||title.length>160)return null;
  const c=await currentTursoCatalog();
  if(!c)return null;
  const keys=["title:"+title,...Object.entries(normalizeExternalWorkIds(externalIds)??{}).map(([ns,id])=>"id:"+ns+":"+id)];
  const queries:Query[]=keys.map(key=>({sql:"SELECT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key=? LIMIT 17",args:[key],maxRows:17}));
  if(includeDiscovery)queries.push({sql:"SELECT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key>=? AND l.key<? ORDER BY l.key LIMIT 20",args:["title:"+title,"title:"+title+"\uffff"],maxRows:20});
  try{
    return await cachedQuery(c,queries,rows=>{
      const exact=new Map<number,MetadataWork>();
      let ambiguous=false;
      for(const bucket of rows.slice(0,keys.length)){
        if(bucket.length===17){ambiguous=true;continue;}
        for(const row of bucket){const work=payload(row[0]);exact.set(work.externalId,work);}
      }
      const discovery=new Map<number,MetadataWork>();
      if(includeDiscovery)for(const row of rows[keys.length]){
        const work=payload(row[0]);if(work.contentRating==="safe")discovery.set(work.externalId,work);
      }
      return {works:ambiguous||exact.size>16?[]:[...exact.values()],discovery:[...discovery.values()]};
    });
  }catch{return null;}
}
export async function getTursoMetadataWork(id:number):Promise<MetadataWork|null>{
  if(!Number.isSafeInteger(id)||id<=0)return null;
  const c=await currentTursoCatalog();
  if(!c)return null;
  try{
    const result=await cachedQuery(c,[{sql:"SELECT payload FROM works WHERE id=? LIMIT 1",args:[String(id)],maxRows:1}],rows=>{
      const work=rows[0][0]?payload(rows[0][0][0]):null;
      return {works:work?.externalId===id&&work.contentRating==="safe"?[work]:[],discovery:[]};
    });
    return result.works[0]??null;
  }catch{return null;}
}

/** Owner-only staged listing classification. One bounded indexed pipeline,
 * never one request per item. Missing identity evidence or an ambiguous
 * bucket cannot inherit a rating. All ratings remain in the candidate set. */
export async function lookupTursoCatalogBatch(items:readonly MangaItem[]):Promise<MetadataWork[][]|null>{
  if(items.length>24)return null;
  const keysByItem:string[][]=items.map(()=>[]);
  let eligible=0;
  for(const [i,item] of items.entries()){
    const title=normalizeTitle(item.title);
    const ids=normalizeExternalWorkIds(item.externalWorkIds);
    if(eligible>=12||!comicFormat(item.format)||title.length<3||title.length>160||
       (!normalizeTitle(item.author)&&!ids))continue;
    keysByItem[i]=["title:"+title,...Object.entries(ids??{}).map(([ns,id])=>"id:"+ns+":"+id)];
    eligible++;
  }
  const keys=[...new Set(keysByItem.flat())].sort();
  if(!keys.length)return items.map(()=>[]);
  const c=await currentTursoCatalog();
  if(!c)return null;
  const queries:Query[]=keys.map(key=>({sql:"SELECT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key=? LIMIT 5",args:[key],maxRows:5}));
  try{
    const buckets=await cachedQuery(c,queries,rows=>rows.map(bucket=>
      bucket.length===5?null:bucket.map(row=>{
        if(row.length!==1)throw Error("Invalid batch catalog row");
        return payload(row[0]);
      })),":private-batch-v1");
    const byKey=new Map(keys.map((key,i)=>[key,buckets[i]]));
    return keysByItem.map(itemKeys=>{
      const matches=new Map<number,MetadataWork>();
      for(const key of itemKeys){
        const bucket=byKey.get(key);
        if(!bucket)return [];
        for(const work of bucket)matches.set(work.externalId,work);
      }
      return matches.size<=16?[...matches.values()]:[];
    });
  }catch{return null;}
}
