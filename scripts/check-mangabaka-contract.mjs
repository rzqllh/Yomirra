// Non-bulk contract check using one documented, safe example series.
import {parseCatalogRecord} from "../src/server/lib/metadata/mangabaka-record.mjs";
const endpoint = "https://api.mangabaka.org";
function shape(value,depth=0){
  if(value===null)return "null";
  if(Array.isArray(value))return value.length?[shape(value[0],depth+1)]:[];
  if(typeof value==="object"&&depth<2)return Object.fromEntries(Object.entries(value).filter(([k])=>k!=="source").slice(0,80).map(([k,v])=>[k,shape(v,depth+1)]));
  return typeof value;
}
for(const path of ["/v2/series/1995?schema=full","/v1/series/1995","/v1/source/anilist/118586"]){
  try{
    const response=await fetch(endpoint+path,{signal:AbortSignal.timeout(8000),redirect:"error",headers:{Accept:"application/json","User-Agent":"Yomirra-Contract-Check/1.0"}});
    if(!response.ok){await response.body?.cancel();console.log(JSON.stringify({path,status:response.status}));process.exitCode=1;break;}
    const reader=response.body.getReader();
    let bytes=0,text="";const decoder=new TextDecoder();
    try{
      while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1024*1024)throw Error("RESPONSE_LIMIT");text+=decoder.decode(value,{stream:true});}
      text+=decoder.decode();
    }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    const body=JSON.parse(text),mapping=path.startsWith("/v1/source/");
    const row=mapping?body.data?.series?.[0]:body.data;
    const normalized=parseCatalogRecord(row);
    if(body.status!==200||row?.id!==1995||!normalized||normalized.externalId!==1995||
       normalized.format!=="manga"||normalized.contentRating!=="safe"||"source" in normalized||
       !normalized.authors?.length||!normalized.aliases?.length||
       (mapping?body.data.series.length!==1:row.content_rating!=="safe"||row.state!=="active"))throw Error("SCHEMA_MISMATCH");
    console.log(JSON.stringify({path,status:response.status,bytes,aliases:normalized.aliases.length,authors:normalized.authors.length,shape:shape(row)}));
  }catch(error){console.log(JSON.stringify({path,error:error.message}));process.exitCode=1;break;}
  await new Promise(r=>setTimeout(r,1200));
}
