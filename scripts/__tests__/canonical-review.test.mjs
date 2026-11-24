import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {buildCatalogIndex} from "../build-mangabaka-index.mjs";
import {prepareReview,validateReview} from "../canonical-review.mjs";
test("creates a bounded review queue without inventing labels and validates only supplied evidence",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"canonical-review-fixture-"));
  try{
    const input=join(dir,"dump.jsonl"),db=join(dir,"index.sqlite"),observations=join(dir,"observations.json"),packet=join(dir,"packet.json"),labels=join(dir,"labels.json");
    await writeFile(input,[{id:1,state:"active",type:"manga",content_rating:"safe",title:"Fixture"},{id:2,state:"active",type:"manga",content_rating:"erotica",title:"Fixture"}].map(JSON.stringify).join("\n"));
    await buildCatalogIndex(input,db,{permitted:true});
    const rows=Array.from({length:300},(_,i)=>({id:"00000000-0000-4000-8000-"+String(i).padStart(12,"0"),sourceId:"mangadex",title:"Fixture",contentRating:"safe",formatHint:"manga"}));
    await writeFile(observations,JSON.stringify({kind:"single-provider-observation",source:"MangaDex",status:"OBSERVATIONS_COLLECTED",rows}));
    assert.deepEqual(await prepareReview(db,observations,packet),{prepared:300,reviewed:0,benchmarkPass:false});
    const bytes=await readFile(packet),p=JSON.parse(bytes);
    assert.equal(p.rows[0].restrictedCandidatePresent,true);
    assert.deepEqual(p.rows[0].candidates.map(c=>c.id),[1]);
    const review={kind:"independent-canonical-review",packetSha256:createHash("sha256").update(bytes).digest("hex"),rows:[{sourceId:rows[0].id,decision:"match",canonicalId:1,reviewer:"synthetic fixture",reason:"Synthetic test only, not real evidence",evidence:[p.rows[0].sourceEvidence,"https://mangabaka.org/"]}]};
    await writeFile(labels,JSON.stringify(review));
    assert.deepEqual(await validateReview(packet,labels),{total:300,submitted:1,resolved:1,matched:1,unmatched:0,ambiguous:0,unresolved:0,candidateMatches:1,candidateRecall:1,reviewComplete:false,independentlyVerified:false,benchmarkPass:false});
    await writeFile(labels,JSON.stringify({...review,rows:[review.rows[0],review.rows[0]]}));
    await assert.rejects(validateReview(packet,labels),/duplicate/);
    await writeFile(labels,JSON.stringify({...review,packetSha256:"wrong"}));
    await assert.rejects(validateReview(packet,labels),/mismatch/);
    await assert.rejects(prepareReview(db,observations,packet),{code:"EEXIST"});
  }finally{await rm(dir,{recursive:true,force:true});}
});
