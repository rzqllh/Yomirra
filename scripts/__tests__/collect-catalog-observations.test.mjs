import test from "node:test";
import assert from "node:assert/strict";
import { collectObservations, readObservation } from "../collect-catalog-observations.mjs";
const row=(i,rating="safe")=>({type:"manga",id:"00000000-0000-4000-8000-"+String(i).padStart(12,"0"),attributes:{contentRating:rating,title:{en:"Fixture "+i},originalLanguage:"ja",links:{mal:"123"}}});
test("bounded collection records observations without claiming independent matching",async()=>{
  const report=await collectObservations({sleep:async()=>{},fetchImpl:async url=>{
    assert.equal(url.hostname,"api.mangadex.org");
    assert.equal(url.searchParams.get("contentRating[]"),"safe");
    const offset=Number(url.searchParams.get("offset"));
    return Response.json({result:"ok",offset,total:500,data:Array.from({length:100},(_,i)=>row(offset+i))});
  }});
  assert.equal(report.count,300);
  assert.equal(report.requests.length,3);
  assert.equal(report.status,"OBSERVATIONS_COLLECTED");
  assert.equal(report.benchmarkPass,false);
  assert.equal(report.independentlyReviewedCrossProviderWorks,0);
});
test("stops on access restriction or rate limit, never retries",async()=>{
  for(const status of [403,429]){
    const report=await collectObservations({sleep:async()=>{},fetchImpl:async()=>new Response("",{status})});
    assert.equal(report.status,"UPSTREAM_UNVERIFIED");
    assert.equal(report.requests.length,1);
    assert.equal(report.count,0);
    assert.equal(report.failure,"HTTP_"+status);
  }
});
test("keeps only explicitly safe valid identities and never fabricates a title",()=>{
  assert.equal(readObservation(row(1,"unknown")),null);
  assert.equal(readObservation({...row(1),id:"invalid"}),null);
  assert.equal(readObservation({...row(1),attributes:{...row(1).attributes,title:{}}}),null);
});
