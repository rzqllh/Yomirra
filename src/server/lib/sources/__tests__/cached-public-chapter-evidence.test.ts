import {describe,it,expect} from "vitest";
import {cachedPublicChapterEvidence} from "../cached-public-chapter-evidence";
const now=100000000;
const detail=(data:unknown,expiresAt=now+1000)=>JSON.stringify({data,expiresAt});
const chapter=(data:unknown,expiresAt=now+1000)=>JSON.stringify({data,expiresAt});
const rows=[{id:"one",mangaId:"work",title:"Chapter 1",number:1,date:"",isLocked:false},
 {id:"other",mangaId:"other",title:"Chapter 90",number:90,date:"",isLocked:false},
 {id:"locked",mangaId:"work",title:"Chapter 99",number:99,date:"",isLocked:true},
 {id:"unknown",mangaId:"work",title:"Chapter 98",number:98,date:""}];
describe("cache-only shared chapter evidence",()=>{
  it("returns only explicit chapter numbering from the correct safe work",()=>{
    expect(cachedPublicChapterEvidence("work",detail({id:"work",contentRating:"safe"}),chapter(rows),now,86400,1800)).toEqual({at:now+1000-1800000,labels:["Chapter 1"]});
  });
  it("fails closed on unknown/restricted/mismatched detail and stale cache",()=>{
    for(const d of [{id:"work"},{id:"work",contentRating:"safe",isNsfw:true},{id:"wrong",contentRating:"safe"}]){
      expect(cachedPublicChapterEvidence("work",detail(d),chapter(rows),now,86400,1800)).toBeUndefined();
    }
    expect(cachedPublicChapterEvidence("work",detail({id:"work",contentRating:"safe"}),chapter(rows,now-1),now,86400,1800)).toBeUndefined();
    expect(cachedPublicChapterEvidence("work",detail({id:"work",contentRating:"safe"}),JSON.stringify(rows),now,86400,1800)).toBeUndefined();
  });
});
