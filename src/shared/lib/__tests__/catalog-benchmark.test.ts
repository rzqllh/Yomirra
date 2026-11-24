import {describe,it,expect} from "vitest";
import {evaluateCatalogEvidence} from "../catalog-benchmark";
const row=(sourceId:string,id:string,expectedWorkId:string,trackerId:string)=>({sourceId,expectedWorkId,manga:{id,title:id,coverUrl:"",format:"manga",contentRating:"safe" as const,externalWorkIds:{anilist:trackerId}}});
describe("catalog benchmark harness",()=>{
  it("measures match precision and recall from independent labels",()=>{
    const data=[row("a","1","work1","101"),row("b","2","work1","101"),row("a","3","work2","102"),row("c","4","work2","103")];
    expect(evaluateCatalogEvidence(data)).toMatchObject({observations:4,labeledWorks:2,truePositives:1,falsePositives:0,falseNegatives:1,precision:1,recall:0.5,coverage:0.5});
    expect(()=>evaluateCatalogEvidence([data[0],data[0]])).toThrow();
  });
});
