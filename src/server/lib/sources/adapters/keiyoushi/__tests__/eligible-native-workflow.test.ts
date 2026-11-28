// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {HttpClient} from "../../base/http-client";
import {getStagedKeiyoushiSource} from "../index";
import {readPrivateBetaCatalog,readPrivateBetaDetail,readPrivateBetaChapter,verifyBetaPageTicket} from "../../../private-beta";
import type {MetadataWork} from "@/shared/lib/metadata-catalog";
import type {MangaItem} from "@/shared/sources/source-types";
const sourceIds=["manhwa-list","izanamiscans","soul-scans","ainzscansid"];
const work=(title:string):MetadataWork=>({provider:"mangabaka",externalId:title==="Fixture Two"?2:1,title,aliases:[title],format:"manhwa",authors:["Writer"],contentRating:"safe"});
vi.mock("@/env",()=>({env:{IMAGE_PROXY_SECRET:"fixture-private-beta-key-not-for-production"}}));
vi.mock("@/server/lib/metadata/local-catalog-index",()=>({findLocalMetadataWorks:()=>null,applyLocalCanonicalMetadata:(row:MangaItem)=>row}));
vi.mock("@/server/lib/metadata/mangabaka",()=>({matchMangaBakaWorks:async(title:string)=>[work(title)]}));
vi.mock("@/server/lib/metadata/turso-catalog",()=>({isTursoCatalogEnabled:()=>true,lookupTursoCatalogBatch:async(rows:MangaItem[])=>rows.map(row=>[work(row.title)])}));
beforeEach(()=>{vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS",sourceIds.join(","));vi.stubGlobal("fetch",vi.fn(()=>{throw Error("Unexpected real network")}));});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe("eligible native adapter workflow with offline fixtures",()=>{
  it.each(sourceIds)("routes %s across catalog, pagination, detail and explicitly unlocked chapter",async(id)=>{
    const adapter=getStagedKeiyoushiSource(id)!;
    expect(adapter.isEnabled).toBe(false);
    const api=id==="ainzscansid",generic=id==="soul-scans";
    const mangaId=api?"101":generic?"comic/fixture":"fixture";
    const chapterId=api?"101/c1":"fixture-chapter-1";
    const lockedId=api?"101/c2":"fixture-chapter-2";
    const unknownId=api?"101/c3":"fixture-chapter-3";
    const detailPath=generic?"/comic/fixture/":"/manga/fixture/";
    const listing=(second:boolean)=>{
      const title=second?"Fixture Two":"Fixture One";
      const href=second?(generic?"/comic/second/":"/manga/second/"):detailPath;
      return '<article class="bsx"><a href="'+href+'" title="'+title+'"><h3 class="tt">'+title+'</h3><span class="typeflag">Manhwa</span><span class="author">Writer</span></a></article>'+
        (second?"":'<div class="pagination"><a class="next" href="?page=2">Next</a></div>');
    };
    const html='<h1 class="entry-title">Fixture One</h1><div class="tsinfo"><div class="imptdt">Type <i>Manhwa</i></div><div class="imptdt">Author <i>Writer</i></div></div><div id="chapterlist"><ul>'+
      '<li data-num="1" data-locked="false"><a href="/fixture-chapter-1/">Chapter 1</a></li>'+
      '<li data-num="2" class="locked"><a href="/fixture-chapter-2/">Chapter 2</a></li>'+
      '<li data-num="3"><a href="/fixture-chapter-3/">Chapter 3</a></li></ul></div>';
    const htmlSpy=vi.spyOn(HttpClient.prototype,"getHtml").mockImplementation(async(path)=>{
      const p=String(path);
      if(p===detailPath)return html;
      if(p==="/fixture-chapter-1")return '<div id="readerarea"><img src="https://cdn.example.test/page1.jpg"><img src="https://cdn.example.test/page2.jpg"></div>';
      if(p.includes("order=")||p.includes("?s="))return listing(p.includes("page=2"));
      throw Error("Unexpected fixture path "+p);
    });
    const jsonSpy=vi.spyOn(HttpClient.prototype,"get").mockImplementation(async(path)=>{
      const p=String(path);
      if(/^\/(popular|latest|search)\?/.test(p)){
        const second=p.includes("page=2");
        return {results:[{id:second?"102":"101",title:second?"Fixture Two":"Fixture One",type:"manhwa",author:"Writer"}],hasNextPage:!second} as any;
      }
      if(p==="/detail/101")return {id:"101",title:"Fixture One",type:"manhwa",author:"Writer"} as any;
      if(p==="/chapters/101")return {chapters:[{id:"c1",number:1,isLocked:false},{id:"c2",number:2,isLocked:true},{id:"c3",number:3}]} as any;
      if(p==="/pages/101/c1")return {mangaId:"101",chapterId:"c1",pages:["https://cdn.example.test/page1.jpg","https://cdn.example.test/page2.jpg"]} as any;
      throw Error("Unexpected fixture path "+p);
    });
    for(const mode of ["popular","latest","search"] as const){
      const query=mode==="search"?"Fixture One":"";
      expect(await readPrivateBetaCatalog(id,query,1,mode)).toMatchObject({items:[{id:mangaId,title:"Fixture One"}],page:1,hasNextPage:true});
    }
    const second=await readPrivateBetaCatalog(id,"",2,"popular");
    expect(second.items.map(row=>row.title)).toEqual(["Fixture Two"]);expect(second.hasNextPage).toBe(false);
    const detail=await readPrivateBetaDetail(id,mangaId);
    expect(detail.chapters.map(row=>[row.id,row.readable])).toEqual([[chapterId,true],[lockedId,false],[unknownId,false]]);
    for(const ch of [lockedId,unknownId])await expect(readPrivateBetaChapter("fixture-owner",id,mangaId,ch)).rejects.toThrow("PRIVATE_BETA_CHAPTER_UNAVAILABLE");
    const chapter=await readPrivateBetaChapter("fixture-owner",id,mangaId,chapterId);
    expect(chapter.pages).toHaveLength(2);
    expect(verifyBetaPageTicket(chapter.pages[0],"fixture-owner")?.url).toBe("https://cdn.example.test/page1.jpg");
    expect(verifyBetaPageTicket(chapter.pages[0],"wrong-account")).toBeNull();
    expect((api?jsonSpy:htmlSpy).mock.calls.filter(c=>String(c[0]).includes(api?"/pages/":"/fixture-chapter-")).length).toBe(1);
    expect(adapter.isEnabled).toBe(false);
  });
});
