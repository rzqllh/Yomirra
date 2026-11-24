import {readFile} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {normalizeTitle} from "../src/shared/lib/normalize-title.mjs";
import {decodeCatalogPayload} from "../src/server/lib/metadata/catalog-payload.mjs";
import {pathToFileURL} from "node:url";
const namespaces=["anilist","my_anime_list","manga_updates"];
function idValue(key,value){
  return typeof value==="string"&&(key==="manga_updates"?/^(?=[a-z0-9]{1,32}$)(?=.*[a-z])[a-z0-9]+$/.test(value):/^[1-9]\d{0,14}$/.test(value));
}
export async function measureCatalogOverlap(index,observationPath){
  const artifact=JSON.parse(await readFile(observationPath,"utf8"));
  if(artifact.kind!=="single-provider-observation"||artifact.source!=="MangaDex"||
     !Array.isArray(artifact.rows)||artifact.rows.length!==300||
     new Set(artifact.rows.map(row=>row.id)).size!==300)throw Error("Expected 300 distinct recorded MangaDex observations");
  const db=new DatabaseSync(index,{readOnly:true});
  const query=db.prepare("SELECT w.payload FROM lookup l JOIN works w ON w.id=l.work_id WHERE l.key=? LIMIT 17");
  const report={observations:300,uniqueTrackerReference:0,trackerUnmapped:0,trackerAmbiguous:0,titleAgrees:0,titleDisagrees:0,titleAmbiguous:0,titleUnmapped:0,formatConflict:0,ratingConflict:0,independentlyReviewedCrossProviderWorks:0,benchmarkPass:false};
  try{
    for(const row of artifact.rows){
      if(row.sourceId!=="mangadex"||row.contentRating!=="safe"||typeof row.title!=="string"||
         !["manga","manhwa","manhua"].includes(row.formatHint))throw Error("Observation boundary mismatch");
      const keys=namespaces.filter(key=>idValue(key,row.externalWorkIds?.[key]));
      const found=new Map();
      let ambiguous=false;
      for(const key of keys){
        const matches=query.all("id:"+key+":"+row.externalWorkIds[key]).map(r=>decodeCatalogPayload(r.payload));
        if(matches.length>1){ambiguous=true;break;}
        for(const work of matches)found.set(work.externalId,work);
      }
      if(ambiguous||found.size>1){report.trackerAmbiguous++;continue;}
      if(found.size===0){report.trackerUnmapped++;continue;}
      const work=[...found.values()][0];
      if(keys.some(key=>work.externalWorkIds?.[key]&&work.externalWorkIds[key]!==row.externalWorkIds[key])){report.trackerAmbiguous++;continue;}
      report.uniqueTrackerReference++;
      if(work.format!==row.formatHint){report.formatConflict++;continue;}
      if(work.contentRating!=="safe"){report.ratingConflict++;continue;}
      const byTitle=query.all("title:"+normalizeTitle(row.title)).map(r=>decodeCatalogPayload(r.payload));
      if(byTitle.length===17){report.titleAmbiguous++;continue;}
      const sameFormat=byTitle.filter(w=>w.format===row.formatHint);
      if(sameFormat.length>1)report.titleAmbiguous++;
      else if(!sameFormat.length)report.titleUnmapped++;
      else if(sameFormat[0].externalId===work.externalId)report.titleAgrees++;
      else report.titleDisagrees++;
    }
    return report;
  }finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=await measureCatalogOverlap(process.argv[2],process.argv[3]);
  console.log(JSON.stringify({stage:"cross_provider_overlap",...result}));
}
