import {describe,it,expect} from "vitest";
import {extendCatalogEvidence} from "../catalog-evidence";
import {clusterCanonicalResults} from "../canonical-search";
import {aggregatePopularFeeds} from "../popular-ranking";
import type {ExternalWorkIds,MangaItem} from "@/shared/sources/source-types";
const row=(sourceId:string,id:string,externalWorkIds:ExternalWorkIds,extra:Partial<MangaItem>={})=>({sourceId,manga:{id,title:sourceId+id,coverUrl:"/cover.jpg",format:"manga",contentRating:"safe" as const,externalWorkIds,...extra}});
const a=row("a","1",{anilist:"123",my_anime_list:"555"});
const b=row("b","2",{anilist:"123",my_anime_list:"555"});
describe("cross-provider tracker evidence",()=>{
  it("groups explicit identifiers without metadata calls and is order independent",()=>{
    const forward=extendCatalogEvidence([a,b]);
    const reverse=extendCatalogEvidence([b,a]);
    expect(forward.size).toBe(2);
    expect(forward.get(JSON.stringify(["a","1"]))).toBe(forward.get(JSON.stringify(["b","2"])));
    expect([...forward.entries()].sort()).toEqual([...reverse.entries()].sort());
    expect(clusterCanonicalResults([a,b],{mergePolicy:"verified-only"})).toHaveLength(1);
    const feeds=[a,b].map(r=>({sourceId:r.sourceId,sourceName:r.sourceId,mangas:[r.manga]}));
    expect(aggregatePopularFeeds(feeds)[0].contributingSources).toBe(2);
  });
  it("rejects conflicting IDs, same-provider editions, unknown ratings and formats",()=>{
    for(const candidate of [
      row("b","2",{anilist:"123",my_anime_list:"556"}),
      row("b","2",{anilist:"123"},{contentRating:"unknown"}),
      row("b","2",{anilist:"123"},{format:"manhwa"}),
      row("a","2",{anilist:"123"}),
      row("b","2",{anilist:"124"},{title:a.manga.title}),
    ]) expect(extendCatalogEvidence([a,candidate]).size).toBe(0);
  });
  it("does not bridge overlapping tracker groups or overwrite reviewed evidence",()=>{
    const left=row("a","1",{anilist:"123"});
    const bridge=row("b","2",{anilist:"123",my_anime_list:"555"});
    const right=row("c","3",{my_anime_list:"555"});
    expect(extendCatalogEvidence([left,bridge,right]).size).toBe(0);
    const reviewed=new Map([[JSON.stringify(["a","1"]),"reviewed:one"]]);
    expect([...extendCatalogEvidence([a,b],reviewed)]).toEqual([...reviewed]);
  });
  it("rejects contradictory duplicate observations of the same provider identity",()=>{
    expect(extendCatalogEvidence([a,{...a,manga:{...a.manga,externalWorkIds:{anilist:"999"}}},b]).size).toBe(0);
  });
});
