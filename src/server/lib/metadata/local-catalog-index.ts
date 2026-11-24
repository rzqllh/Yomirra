import { statSync } from "node:fs";
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
let current:{path:string;mtime:number;db:ReadOnlyIndex;createdAt:number}|undefined;
let checkedAt=0;
const MAX_AGE=7*24*60*60*1000;
const MAX_MATCHES=16;
function dbForLookup():ReadOnlyIndex|null{
  if(process.env.YOMIRRA_MANGABAKA_METADATA!=="permitted")return null;
  const configured=process.env.YOMIRRA_MANGABAKA_INDEX_PATH;
  if(!configured)return null;
  const path=resolve(configured);
  const now=Date.now();
  if(current?.path===path && now-checkedAt<30_000 && now-current.createdAt<=MAX_AGE)return current.db;
  checkedAt=now;
  try{
    const stat=statSync(path);
    if(!stat.isFile()||stat.size>200*1024*1024)return null;
    if(current?.path===path&&current.mtime===stat.mtimeMs)return now-current.createdAt<=MAX_AGE?current.db:null;
    const sqlite=(process as NodeJS.Process & {getBuiltinModule?:(id:string)=>unknown}).getBuiltinModule?.("node:sqlite") as BuiltinSqlite|undefined;
    if(!sqlite?.DatabaseSync)return null;
    const candidate=new sqlite.DatabaseSync(path,{readOnly:true});
    try{
      const manifest=candidate.prepare("SELECT schema_version, created_at, license, provider FROM manifest LIMIT 1").get() as {schema_version?:number;created_at?:string;license?:string;provider?:string}|undefined;
      const created=Date.parse(manifest?.created_at??"");
      if(manifest?.schema_version!==1||manifest.provider!=="mangabaka"||manifest.license!=="CC-BY-NC-SA-4.0"||
         !Number.isFinite(created)||created>now||now-created>MAX_AGE){candidate.close();return null;}
      current?.db.close();
      current={path,mtime:stat.mtimeMs,db:candidate,createdAt:created};
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
        const raw=(row as {payload?:unknown}).payload;
        if(typeof raw!=="string"||raw.length>64*1024)return null;
        const work=JSON.parse(raw) as MetadataWork;
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
