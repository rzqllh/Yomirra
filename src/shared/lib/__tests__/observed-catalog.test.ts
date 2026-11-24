import { describe, expect, it } from "vitest";
import { getObservedCatalogHref, inspectObservedCatalog, observedCatalogBackHref, parseObservedCatalogRefs } from "../observed-catalog";
import type { MangaDetail } from "@/shared/sources/source-types";

const refs=[{sourceId:"shinigami",mangaId:"a"},{sourceId:"mangadex",mangaId:"b"}];
const detail=(id:string,tracker:string):MangaDetail=>({id,title:"Fixture",coverUrl:"",description:"",status:"ONGOING",genres:[],format:"manga",contentRating:"safe",externalWorkIds:{anilist:tracker}});
describe("observed canonical detail boundary",()=>{
  it("encodes only bounded explicit safe public references",()=>{
    const href=getObservedCatalogHref(refs.map(ref=>({...ref,title:"Fixture",contentRating:"safe"})),"/search?q=fixture");
    expect(href).toBeDefined();
    const params=new URL(href!,"https://example.test").searchParams;
    expect(parseObservedCatalogRefs(params.get("refs"))).toEqual(refs);
    expect(params.get("returnTo")).toBe("/search?q=fixture");
    expect(getObservedCatalogHref(refs.map(ref=>({...ref,title:"Fixture",contentRating:"unknown"})))).toBeUndefined();
  });
  it("rejects staged, duplicate, unsafe route identities and external back paths",()=>{
    for(const values of [[["ainzscansid","a"],["mangadex","b"]],[["shinigami","a"],["shinigami","b"]],[["shinigami","../a"],["mangadex","b"]],[["shinigami","https://example.test"],["mangadex","b"]]]){
      expect(parseObservedCatalogRefs(JSON.stringify(values))).toEqual([]);
    }
    expect(observedCatalogBackHref("//other.test")).toBe("/search");
    expect(observedCatalogBackHref("/\\other.test")).toBe("/search");
  });
  it("requires every independent live detail to support the same identity",()=>{
    const rows=[{...refs[0],detail:detail("a","100")},{...refs[1],detail:detail("b","100")}];
    expect(inspectObservedCatalog(refs,rows)).toMatchObject({verified:true});
    expect(inspectObservedCatalog(refs,rows.slice(0,1))).toMatchObject({verified:false});
    expect(inspectObservedCatalog(refs,[rows[0],{...rows[1],detail:detail("b","101")}])).toMatchObject({verified:false});
    expect(inspectObservedCatalog(refs,[rows[0],{...rows[1],detail:{...rows[1].detail,contentRating:"unknown"}}])).toMatchObject({verified:false,visible:[rows[0]]});
  });
});
