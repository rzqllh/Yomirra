import {describe,it,expect} from "vitest";
import {boundIntelligenceCandidates,type SearchCatalogCandidate} from "../search-intelligence";
describe("bounded search intelligence payload",()=>{
  it("limits optional ranking without mutating provider results or IDs",()=>{
    const rows:SearchCatalogCandidate[]=Array.from({length:100},(_,i)=>({canonicalKey:"key-"+i,sourceId:"source",mangaId:"id-"+i,title:"t".repeat(450),alternativeTitles:Array.from({length:500},()=> "a".repeat(500)),description:"d".repeat(12000),sourceBindings:[{sourceId:"source",mangaId:"id-"+i,title:"t".repeat(400)}]}));
    const bounded=boundIntelligenceCandidates(rows);
    expect(bounded).toHaveLength(40);
    expect(bounded[0].alternativeTitles).toHaveLength(20);
    expect(bounded[0].alternativeTitles?.[0]).toHaveLength(300);
    expect(bounded[0].sourceBindings?.[0].title).toHaveLength(300);
    expect(bounded[0].mangaId).toBe("id-0");
    expect(rows).toHaveLength(100);expect(rows[0].alternativeTitles).toHaveLength(500);
    expect(boundIntelligenceCandidates([{...rows[0],mangaId:"x".repeat(501)}])).toEqual([]);
  });
});
