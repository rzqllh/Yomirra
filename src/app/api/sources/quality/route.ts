import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimitPolicy, createRateLimitRejection, applyRateLimitHeaders } from "@/server/lib/security/rate-limit";
import { isRedisConfigured,isRedisCommandAllowed,redis } from "@/server/lib/cache/redis";
import { CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { reserveOptionalService } from "@/server/lib/cache/optional-service-budget";
import { getRequestReadOptions,contentCacheKey,assertSourceAccess } from "@/server/lib/sources/content-access";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { getDurableCoreSourceOverrides } from "@/server/lib/sources/admin-source-service";
import { cachedPublicChapterEvidence } from "@/server/lib/sources/cached-public-chapter-evidence";
import { qualityKey,type SharedChapterEvidence } from "@/shared/lib/source-quality";

export const dynamic="force-dynamic";
const schema=z.array(z.object({sourceId:z.string().regex(/^[a-z0-9-]{1,64}$/),mangaId:z.string().min(1).max(300).refine(v=>!/[\u0000-\u001f\u007f]/.test(v))})).min(2).max(8);

async function boundedBody(request:NextRequest){
  const reader=request.body?.getReader();
  if(!reader)throw Error("Missing body");
  let size=0,text="";
  const decoder=new TextDecoder();
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;if(size>4096)throw Error("Body too large");
      text+=decoder.decode(value,{stream:true});
    }
    return JSON.parse(text+decoder.decode());
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function POST(request:NextRequest){
  const limit=await checkRateLimitPolicy(request,"publicSearch");
  if(!limit.success)return createRateLimitRejection(limit);
  const respond=(data:SharedChapterEvidence,status=200)=>applyRateLimitHeaders(
    NextResponse.json({data},{status,headers:{"Cache-Control":"private, no-store"}}),limit);
  let raw:unknown;
  try{raw=await boundedBody(request);}catch{return respond({},400);}
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return respond({},400);
  if(!isRedisConfigured||!isRedisCommandAllowed()||!await reserveOptionalService("sqs"))return respond({});
  try{
    // Static built-ins only. No user manifests, arbitrary URLs, private beta,
    // or adult-scope caches. Honor the authoritative admin disable switch.
    const overrides=await getDurableCoreSourceOverrides();
    const builtin=sourceManager.getAllSources();
    const options=getRequestReadOptions(request);
    const refs=[...new Map(parsed.data.map(ref=>[qualityKey(ref.sourceId,ref.mangaId),ref])).values()];
    const requests=refs.flatMap(ref=>{
      const source=builtin.find(s=>s.id===ref.sourceId&&!s.isDynamic&&!s.isNsfw);
      if(!source||overrides[ref.sourceId]?.isEnabled===false)return [];
      try{assertSourceAccess(source,options);}catch{return [];}
      return [{ref,keys:[contentCacheKey(source,"manga",ref.mangaId,options),contentCacheKey(source,"chapters",ref.mangaId,options)]}];
    });
    if(new Set(requests.map(r=>r.ref.sourceId)).size<2)return respond({});
    // One bounded MGET for all existing cache entries; no writes, probes,
    // upstream fan-out or per-user telemetry.
    const rows=await redis.mget(...requests.flatMap(r=>r.keys));
    const result:SharedChapterEvidence={};
    let bytes=0;
    requests.forEach(({ref},i)=>{
      const evidence=cachedPublicChapterEvidence(ref.mangaId,rows[i*2],rows[i*2+1],Date.now(),CACHE_TTL.DETAIL,CACHE_TTL.CHAPTERS);
      if(evidence){
        const key=qualityKey(ref.sourceId,ref.mangaId);
        bytes+=JSON.stringify([key,evidence]).length;
        if(bytes<=128*1024)result[key]=evidence;
      }
    });
    return respond(result);
  }catch{return respond({});}
}
