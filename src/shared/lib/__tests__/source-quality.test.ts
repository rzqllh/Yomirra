import {describe,it,expect} from "vitest";
import {calculateSourceQuality,qualityKey,rankQualityRefs,chapterQualityEvidence,sharedProbeQuality,type QualityEvidence} from "../source-quality";
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

describe("shared monitoring quality",()=>{
  it("does not invent reader success or use stale/insufficient probes",()=>{
    const sample={checkedAt:new Date(now-100).toISOString(),uptime:"80.0%",p95Latency:"1000ms",sampleCount:5,hasSufficientData:true};
    expect(sharedProbeQuality(sample,now)).toMatchObject({metrics:{reliability:80,speed:50},coverage:50,score:68});
    expect(sharedProbeQuality({...sample,sampleCount:4},now).score).toBeNull();
    expect(sharedProbeQuality({...sample,checkedAt:new Date(now+1).toISOString()},now).score).toBeNull();
    expect(sharedProbeQuality({...sample,uptime:"1000%",p95Latency:"-"},now).score).toBeNull();
  });
  it("uses shared probe evidence only as fallback and supports explicit sort",()=>{
    const refs=[{sourceId:"a",mangaId:"1"},{sourceId:"b",mangaId:"2"}];
    const shared={a:{checkedAt:new Date(now-100).toISOString(),uptime:"100%",p95Latency:"2000ms",sampleCount:5,hasSufficientData:true},
      b:{checkedAt:new Date(now-100).toISOString(),uptime:"40%",p95Latency:"200ms",sampleCount:5,hasSufficientData:true}};
    expect(rankQualityRefs(refs,{}, {shared,sort:"speed",now})[0]).toMatchObject({ref:refs[1],scope:"monitor"});
    expect(rankQualityRefs(refs,{}, {shared,preferred:"a",sort:"speed",now})[0].ref).toEqual(refs[0]);
  });
});
