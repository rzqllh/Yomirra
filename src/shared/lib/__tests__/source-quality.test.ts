import {describe,it,expect} from "vitest";
import {calculateSourceQuality,qualityKey,rankQualityRefs,chapterQualityEvidence,type QualityEvidence} from "../source-quality";
const now=1_000_000;
const samples=(ok:boolean,kind:"api"|"image",ms:number)=>Array.from({length:5},(_,i)=>({at:now-100,ok,kind,ms,key:String(i)}));
describe("evidence-based source quality",()=>{
  it("does not invent scores for missing, stale, future or insufficient samples",()=>{
    expect(calculateSourceQuality(undefined,[],now).score).toBeNull();
    expect(calculateSourceQuality({samples:samples(true,"api",500).slice(0,1)},[],now).score).toBeNull();
    expect(calculateSourceQuality({samples:samples(true,"api",500).map(s=>({...s,at:now+1}))},[],now).score).toBeNull();
  });
  it("measures five metrics with approved weights and explicit coverage",()=>{
    const own={at:now,labels:["Chapter 1"]},peer={at:now,labels:["Chapter 1","Chapter 2"]};
    const evidence:QualityEvidence={samples:[...samples(true,"api",500),...samples(true,"image",500)],chapters:own};
    expect(calculateSourceQuality(evidence,[own,peer],now)).toMatchObject({coverage:100,score:88,metrics:{reliability:100,reader:100,speed:100,completeness:50,freshness:50}});
    expect(calculateSourceQuality(evidence,[],now)).toMatchObject({coverage:75,score:100});
  });
  it("never counts locked or invented chapter indices",()=>{
    expect(chapterQualityEvidence([{id:"x",mangaId:"a",title:"Special",number:10,date:"",isLocked:false},{id:"y",mangaId:"a",title:"Chapter 2",number:2,date:"",isLocked:true}],"a",now)).toBeUndefined();
  });
  it("keeps explicit preferred source ahead of speed and does not mutate source list",()=>{
    const refs=[{sourceId:"a",mangaId:"1",language:"id"},{sourceId:"b",mangaId:"2",language:"en"}];
    const snapshot={[qualityKey("a","1")]:{samples:samples(false,"api",500)},[qualityKey("b","2")]:{samples:samples(true,"api",500)}};
    expect(rankQualityRefs(refs,snapshot,{preferred:"a",now})[0].ref.sourceId).toBe("a");
    expect(rankQualityRefs(refs,snapshot,{languages:["en"],now})[0].ref.sourceId).toBe("b");
    expect(refs.map(r=>r.sourceId)).toEqual(["a","b"]);
  });
});
