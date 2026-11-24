// Offline review queue. No upstream requests, binding registration or user writes.
import {readFile,writeFile,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
import {pathToFileURL} from "node:url";
import {normalizeTitle} from "../src/shared/lib/normalize-title.mjs";
import {decodeCatalogPayload} from "../src/server/lib/metadata/catalog-payload.mjs";

const TARGET=300;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digest=value=>createHash("sha256").update(value).digest("hex");
const formats=["manga","manhwa","manhua"];
const keys=["anilist","my_anime_list","manga_updates"];
async function readJson(path){
  const info=await stat(path);
  if(!info.isFile()||info.size>16*1024*1024)throw Error("Invalid review input size");
  const bytes=await readFile(path);
  return {data:JSON.parse(bytes),sha256:digest(bytes)};
}
function trackerKeys(row){
  return keys.flatMap(key=>{
    const id=row.externalWorkIds?.[key];
    return typeof id==="string"&&(key==="manga_updates"?/^(?=[a-z0-9]{1,32}$)(?=.*[a-z])[a-z0-9]+$/.test(id):/^[1-9]\d{0,14}$/.test(id))?["id:"+key+":"+id]:[];
  });
}
export async function prepareReview(index,observations,output){
  const {data:input,sha256}=await readJson(observations);
  if(input.kind!=="single-provider-observation"||input.source!=="MangaDex"||
     input.status!=="OBSERVATIONS_COLLECTED"||!Array.isArray(input.rows)||input.rows.length!==TARGET||
     new Set(input.rows.map(r=>r.id)).size!==TARGET)throw Error("300 distinct observed MangaDex works required");
  const db=new DatabaseSync(index,{readOnly:true});
  try{
    const manifest=db.prepare("SELECT schema_version,provider,license,source_sha256 FROM manifest LIMIT 2").all();
    if(manifest.length!==1||manifest[0].schema_version!==2||manifest[0].provider!=="mangabaka"||
       manifest[0].license!=="CC-BY-NC-SA-4.0"||!/^[a-f0-9]{64}$/.test(manifest[0].source_sha256))throw Error("Unverified catalog manifest");
    const lookup=db.prepare("SELECT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key=? LIMIT 17");
    const rows=input.rows.map(row=>{
      if(!uuid.test(row.id)||row.sourceId!=="mangadex"||row.contentRating!=="safe"||
         typeof row.title!=="string"||!row.title.trim()||!formats.includes(row.formatHint))throw Error("Invalid observation");
      const titles=[...new Set([row.title,...(Array.isArray(row.aliases)?row.aliases:[])].slice(0,100).map(normalizeTitle).filter(Boolean))];
      const matches=new Map();
      let overflow=false,restricted=false;
      for(const key of [...trackerKeys(row),...titles.map(t=>"title:"+t)]){
        const bucket=lookup.all(key);
        if(bucket.length===17){overflow=true;break;}
        for(const entry of bucket){
          const work=decodeCatalogPayload(entry.payload);
          if(work.contentRating!=="safe"){restricted=true;continue;}
          matches.set(work.externalId,{id:work.externalId,title:work.title,format:work.format,authors:(work.authors??[]).slice(0,20)});
          if(matches.size>16){overflow=true;break;}
        }
        if(overflow)break;
      }
      return {sourceId:row.id,title:row.title,formatHint:row.formatHint,sourceEvidence:"https://mangadex.org/title/"+row.id,
        candidates:overflow?[]:[...matches.values()].sort((a,b)=>a.id-b.id),overflow,restrictedCandidatePresent:restricted};
    });
    const packet={schemaVersion:1,kind:"canonical-review-queue",catalogSnapshot:manifest[0].source_sha256,
      observationSha256:sha256,attribution:"MangaBaka (CC BY-NC-SA 4.0); MangaDex observations; retain applicable provider attribution",rows};
    await writeFile(output,JSON.stringify(packet,null,2)+"\n",{flag:"wx"});
    return {prepared:rows.length,reviewed:0,benchmarkPass:false};
  }finally{db.close();}
}
export async function validateReview(packetPath,labelPath){
  const {data:packet,sha256}=await readJson(packetPath);
  const {data:labels}=await readJson(labelPath);
  if(packet.kind!=="canonical-review-queue"||packet.schemaVersion!==1||!Array.isArray(packet.rows)||
     packet.rows.length!==TARGET||new Set(packet.rows.map(r=>r.sourceId)).size!==TARGET||
     labels.kind!=="independent-canonical-review"||labels.packetSha256!==sha256||!Array.isArray(labels.rows)||
     labels.rows.length>TARGET)throw Error("Review packet mismatch");
  const expected=new Map(packet.rows.map(row=>[row.sourceId,row]));
  const seen=new Set();
  let matched=0,unmatched=0,ambiguous=0,unresolved=0,found=0;
  for(const row of labels.rows){
    const observation=expected.get(row.sourceId);
    if(!observation||seen.has(row.sourceId))throw Error("Unknown or duplicate label");
    seen.add(row.sourceId);
    if(!["match","no-match","ambiguous","unresolved"].includes(row.decision)||
       typeof row.reviewer!=="string"||!row.reviewer.trim()||
       typeof row.reason!=="string"||row.reason.trim().length<10||row.reason.length>2000||
       !Array.isArray(row.evidence)||row.evidence.length>10||
       !row.evidence.includes(observation.sourceEvidence))throw Error("Review evidence missing");
    const hosts=new Set(row.evidence.map(raw=>{
      const url=new URL(raw);
      if(url.protocol!=="https:"||url.username||url.password||url.port)throw Error("Invalid evidence URL");
      return url.hostname.replace(/^www\./,"");
    }));
    if(row.decision!=="unresolved"&&!["mangabaka.org","anilist.co","myanimelist.net","mangaupdates.com"].some(host=>hosts.has(host)))throw Error("Independent reference required");
    if(row.decision==="match"){
      if(!Number.isSafeInteger(row.canonicalId)||row.canonicalId<=0)throw Error("Canonical ID required");
      matched++;
      if(observation.candidates.some(c=>c.id===row.canonicalId))found++;
    }else{
      if(row.canonicalId!==undefined&&row.canonicalId!==null)throw Error("Non-match cannot assert a canonical identity");
      if(row.decision==="no-match")unmatched++;
      else if(row.decision==="ambiguous")ambiguous++;
      else unresolved++;
    }
  }
  // Labels are reviewer-supplied, not independently authenticated by this
  // tool. Candidate recall is not runtime matcher precision/recall.
  return {total:TARGET,submitted:seen.size,resolved:matched+unmatched+ambiguous,matched,unmatched,ambiguous,unresolved,
    candidateMatches:found,candidateRecall:matched?found/matched:null,reviewComplete:seen.size===TARGET&&unresolved===0,
    independentlyVerified:false,benchmarkPass:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [mode,...args]=process.argv.slice(2);
  if(mode==="prepare"&&args.length===3)console.log(JSON.stringify(await prepareReview(...args)));
  else if(mode==="validate"&&args.length===2)console.log(JSON.stringify(await validateReview(...args)));
  else throw Error("Usage: prepare INDEX OBSERVATIONS OUTPUT | validate PACKET LABELS");
}
