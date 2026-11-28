import { lstatSync, readFileSync, statSync } from "node:fs";
import { decodeCatalogPayload } from "./catalog-payload.mjs";
import { isSnapshot, MAX_CATALOG_FRESHNESS_MS, parseCatalogFreshnessAttestation } from "./catalog-slots.mjs";
import { resolve } from "node:path";
import type { MetadataWork } from "@/shared/lib/metadata-catalog";
import { inheritCanonicalRating, matchCanonicalMetadata } from "@/shared/lib/metadata-catalog";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import { normalizeExternalWorkIds } from "@/shared/lib/external-work-ids";
import type { MangaItem,ExternalWorkIds } from "@/shared/sources/source-types";

interface ReadOnlyIndex{
  prepare(sql:string):{all(...params:string[]):unknown[];get(...params:string[]):unknown};
  close():void;
}
type BuiltinSqlite={DatabaseSync:new(path:string,opts:{readOnly:boolean})=>ReadOnlyIndex};
let current:{path:string;mtime:number;freshnessMtime:number;db:ReadOnlyIndex;createdAt:number;verifiedAt:number}|undefined;
let checkedAt=0;
let checkedPath:string|undefined;
let checkedDb:ReadOnlyIndex|null=null;
const MAX_AGE=MAX_CATALOG_FRESHNESS_MS;
const MAX_MATCHES=16;
function readLocalFreshness(path:string,snapshot:string|undefined,createdAt:string,createdMs:number,now:number):{verifiedAt:number;mtime:number}|null{
  const file=path+".freshness.json";
  let fstat;
  try{fstat=lstatSync(file);}catch(err:unknown){
    if((err as NodeJS.ErrnoException)?.code==="ENOENT"){
      return now>=createdMs&&now-createdMs<=MAX_AGE?{verifiedAt:createdMs,mtime:0}:null;
    }
    return null;
  }
  if(!fstat.isFile()||fstat.isSymbolicLink()||fstat.size<=0||fstat.size>1024||!isSnapshot(snapshot))return null;
  try{
    const parsed=parseCatalogFreshnessAttestation(readFileSync(file,"utf8"),{snapshot,createdAt,now});
    return {verifiedAt:Math.max(createdMs,parsed.verifiedAtMs),mtime:fstat.mtimeMs};
  }catch{return null;}
}
function dbForLookup():ReadOnlyIndex|null{
  if(process.env.YOMIRRA_MANGABAKA_METADATA!=="permitted")return null;
  const configured=process.env.YOMIRRA_MANGABAKA_INDEX_PATH;
  if(!configured)return null;
  const path=resolve(configured);
  const now=Date.now();
  if(checkedPath===path && now>=checkedAt && now-checkedAt<30_000){
    return current&&checkedDb===current.db&&now>=current.verifiedAt&&now-current.verifiedAt<=MAX_AGE?checkedDb:null;
  }
  checkedAt=now;checkedPath=path;checkedDb=null;
  try{
    const stat=statSync(path);
    if(!stat.isFile()||stat.size>200*1024*1024)return null;
    if(current?.path===path&&current.mtime===stat.mtimeMs){
      let freshnessMtime=0;
      try{
        const fstat=lstatSync(path+".freshness.json");
        if(!fstat.isFile()||fstat.isSymbolicLink())return null;
        freshnessMtime=fstat.mtimeMs;
      }catch(err:unknown){
        if((err as NodeJS.ErrnoException)?.code!=="ENOENT")return null;
      }
      if(freshnessMtime===current.freshnessMtime){
        checkedDb=now>=current.verifiedAt&&now-current.verifiedAt<=MAX_AGE?current.db:null;
        return checkedDb;
      }
    }
    const sqlite=(process as NodeJS.Process & {getBuiltinModule?:(id:string)=>unknown}).getBuiltinModule?.("node:sqlite") as BuiltinSqlite|undefined;
    if(!sqlite?.DatabaseSync)return null;
    const candidate=new sqlite.DatabaseSync(path,{readOnly:true});
    try{
      const manifest=candidate.prepare("SELECT schema_version, created_at, license, provider FROM manifest LIMIT 1").get() as {schema_version?:number;created_at?:string;license?:string;provider?:string}|undefined;
      const createdAtIso=manifest?.created_at??"";
      const created=Date.parse(createdAtIso);
      if((manifest?.schema_version!==1&&manifest?.schema_version!==2)||manifest.provider!=="mangabaka"||manifest.license!=="CC-BY-NC-SA-4.0"||
         !Number.isFinite(created)||created>now){candidate.close();return null;}
      const sha=manifest.schema_version===2
        ? (candidate.prepare("SELECT source_sha256 FROM manifest LIMIT 1").get() as {source_sha256?:string}|undefined)?.source_sha256
        : undefined;
      const freshness=readLocalFreshness(path,sha,createdAtIso,created,now);
      if(!freshness){candidate.close();return null;}
      current?.db.close();
      current={path,mtime:stat.mtimeMs,freshnessMtime:freshness.mtime,db:candidate,createdAt:created,verifiedAt:freshness.verifiedAt};
      checkedDb=candidate;
      return candidate;
    }catch{candidate.close();return null;}
  }catch{return null;}
}

/** null means unavailable or invalid; [] means no unique candidate.
 * One local indexed lookup per requested alias/ID; no network calls.
 * A highly ambiguous bucket is never truncated into a false unique match. */
export function findLocalMetadataWorks(input:{titles?:readonly string[];externalWorkIds?:ExternalWorkIds}):MetadataWork[]|null{
  const db=dbForLookup();
  if(!db)return null;
  try{
    const keys=[...new Set((input.titles??[]).slice(0,12).map(normalizeTitle).filter(s=>s&&s.length<=1000))].map(s=>"title:"+s);
    for(const [ns,id] of Object.entries(normalizeExternalWorkIds(input.externalWorkIds)??{}))keys.push("id:"+ns+":"+id);
    if(!keys.length)return [];
    const query=db.prepare("SELECT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key=? LIMIT 17");
    const records=new Map<number,MetadataWork>();
    for(const key of keys){
      const rows=query.all(key);
      if(rows.length>MAX_MATCHES)return [];
      for(const row of rows){
        const work=decodeCatalogPayload((row as {payload?:unknown}).payload);
        if(work.provider!=="mangabaka"||!Number.isSafeInteger(work.externalId)||
           !Array.isArray(work.aliases)||typeof work.title!=="string"||!["safe","suggestive","erotica","pornographic"].includes(work.contentRating))return null;
        records.set(work.externalId,work);
      }
      if(records.size>MAX_MATCHES)return [];
    }
    return [...records.values()];
  }catch{return null;}
}
export function applyLocalCanonicalMetadata<T extends MangaItem>(item:T):T{
  const works=findLocalMetadataWorks({titles:[item.title,item.originalTitle??"",...(item.alternativeTitles??[])],externalWorkIds:item.externalWorkIds});
  const work=works&&matchCanonicalMetadata(item,works);
  // Source IDs and chapter metadata stay source-local. Preserve canonical
  // aliases without implying that an external title has a readable edition.
  if(!work)return item;
  const classified=inheritCanonicalRating(item,work);
  return {...classified,alternativeTitles:[...new Set([...(item.alternativeTitles??[]),work.title,...work.aliases])].slice(0,500)};
}

export function getLocalMetadataWork(id:number):MetadataWork|null{
  if(!Number.isSafeInteger(id)||id<=0)return null;
  try{
    const row=dbForLookup()?.prepare("SELECT payload FROM works WHERE id=?").get(String(id)) as {payload?:unknown}|undefined;
    if(!row)return null;
    const work=decodeCatalogPayload(row.payload);
    return work.provider==="mangabaka"&&work.externalId===id&&work.contentRating==="safe"&&typeof work.title==="string"&&Array.isArray(work.aliases)?work:null;
  }catch{return null;}
}
/** Prefix lookup is discovery only. It must never participate in rating inheritance. */
export function discoverLocalMetadataWorks(query:string):MetadataWork[]{
  const key=normalizeTitle(query);
  if(key.length<3||key.length>160)return [];
  try{
    const rows=dbForLookup()?.prepare("SELECT DISTINCT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key>=? AND l.key<? ORDER BY l.key LIMIT 20").all("title:"+key,"title:"+key+"\uffff")??[];
    return rows.flatMap(row=>{
      const work=decodeCatalogPayload((row as {payload?:unknown}).payload);
      return work.provider==="mangabaka"&&work.contentRating==="safe"&&Number.isSafeInteger(work.externalId)&&typeof work.title==="string"&&Array.isArray(work.aliases)?[work]:[];
    });
  }catch{return [];}
}
