import { afterEach, describe, expect, it, vi } from "vitest";
import { privateBetaSources, privateBetaAllowsSource, readPrivateBetaCatalog, readPrivateBetaDetail, readPrivateBetaChapter, verifyBetaPageTicket, fetchPrivateBetaPage, validBetaIdentity } from "../private-beta";
import { getStagedKeiyoushiSource } from "../adapters/keiyoushi";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { matchMangaBakaWorks } from "@/server/lib/metadata/mangabaka";
import {isTursoCatalogEnabled,lookupTursoCatalogBatch} from "@/server/lib/metadata/turso-catalog";
vi.mock("@/server/lib/metadata/turso-catalog",()=>({isTursoCatalogEnabled:vi.fn(()=>false),lookupTursoCatalogBatch:vi.fn()}));
vi.mock("@/server/lib/metadata/mangabaka",()=>({matchMangaBakaWorks:vi.fn().mockResolvedValue([])}));
vi.mock("@/env", () => ({env:{IMAGE_PROXY_SECRET:"fixture-secret-32-characters-only-for-tests"}}));
vi.mock("@/server/lib/security/outbound-policy", () => ({safeFetch:vi.fn()}));

vi.mock("../adapters/keiyoushi", () => ({getStagedKeiyoushiSource:vi.fn()}));
afterEach(() => {vi.unstubAllEnvs(); vi.clearAllMocks();vi.mocked(isTursoCatalogEnabled).mockReturnValue(false);});
describe("private beta scope", () => {
  it("defaults to no permitted live sources and excludes restricted/duplicate/prototype identities", () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","");
    const inventory=privateBetaSources();
    expect(inventory).toHaveLength(31);
    expect(inventory.every(s => !s.available&&!s.liveVerified)).toBe(true);
    expect(inventory.filter(s=>s.eligible)).toHaveLength(4);
    expect(inventory.filter(s=>s.implementation==="engine")).toHaveLength(27);
    expect(inventory.filter(s=>s.implementation==="duplicate")).toHaveLength(1);
    expect(inventory.filter(s=>s.implementation==="restricted-prototype")).toHaveLength(3);
    expect(privateBetaSources("manhwa-list,kiryuu,komikindoid,manga-plus-by-shueisha,webcomics").filter(s => s.available).map(s => s.id)).toEqual(["manhwa-list"]);
  });
  it("cannot invoke an adapter without explicit permission", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","");
    await expect(readPrivateBetaCatalog("manhwa-list","")).rejects.toThrow("PRIVATE_BETA_SOURCE_UNAVAILABLE");
    expect(getStagedKeiyoushiSource).not.toHaveBeenCalled();
  });
  it("returns only safe bounded metadata and never changes adapter enablement", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const adapter = {id:"manhwa-list",isEnabled:false,isNsfw:false,getPopular:vi.fn().mockResolvedValue({mangas:[
      {id:"safe",title:"Safe title",contentRating:"safe",coverUrl:"https://example.test/cover"},
      {id:"unknown",title:"Unknown rating"}, {id:"restricted",title:"Restricted",contentRating:"erotica"}
    ],hasNextPage:false}),getPages:vi.fn()};
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    expect(privateBetaAllowsSource("manhwa-list")).toBe(true);
    expect(await readPrivateBetaCatalog("manhwa-list","")).toEqual({items:[{id:"safe",title:"Safe title",format:undefined}],received:3,page:1,hasNextPage:false});
    expect(adapter.getPages).not.toHaveBeenCalled();
    expect(adapter.isEnabled).toBe(false);
  });
});

describe("private catalogue pagination", () => {
  it("dispatches one explicit operation without exposing unknown-rated content", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const result={mangas:[{id:"fixture",title:"Fixture",coverUrl:"",contentRating:"safe"},{id:"unknown",title:"Unknown",coverUrl:"",contentRating:"unknown"}],hasNextPage:true};
    const adapter={id:"manhwa-list",isEnabled:false,isNsfw:false,getPopular:vi.fn().mockResolvedValue(result),getLatest:vi.fn().mockResolvedValue(result),search:vi.fn().mockResolvedValue(result)};
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    expect(await readPrivateBetaCatalog("manhwa-list","",2,"latest")).toMatchObject({items:[{id:"fixture"}],received:2,page:2,hasNextPage:true});
    expect(adapter.getLatest).toHaveBeenCalledWith(2,expect.objectContaining({hideNsfw:true}));
    expect(await readPrivateBetaCatalog("manhwa-list","fixture",20,"search")).toMatchObject({page:20,hasNextPage:false});
    expect(adapter.search).toHaveBeenCalledWith("fixture",20,undefined,expect.objectContaining({hideNsfw:true}));
    expect(adapter.getPopular).not.toHaveBeenCalled();
    await expect(readPrivateBetaCatalog("manhwa-list","",21,"latest")).rejects.toThrow("PRIVATE_BETA_INVALID_CATALOG_REQUEST");
    expect(adapter.getLatest).toHaveBeenCalledTimes(1);
  });
});

describe("private reader boundaries", () => {
  const fixture = () => ({
    id:"manhwa-list",isEnabled:false,isNsfw:false,
    getDetail:vi.fn().mockResolvedValue({id:"manga",title:"Fixture",contentRating:"safe"}),
    getChapters:vi.fn().mockResolvedValue([
      {id:"chapter-1",mangaId:"manga",title:"Chapter 1",isLocked:false},
      {id:"locked",mangaId:"manga",title:"Locked",isLocked:true},
      {id:"unknown",mangaId:"manga",title:"Unknown"},
      {id:"foreign",mangaId:"other",title:"Other",isLocked:false},
      {id:"https://other.example/path",mangaId:"manga",title:"Invalid",isLocked:false}
    ]),
    getPages:vi.fn().mockResolvedValue({chapterId:"chapter-1",pages:[{index:1,url:"https://cdn.example.test/page.jpg"}]}),
  });
  it("rejects URLs and traversals before adapter access", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    for(const invalid of ["https://other.example/a","../x","%2e%2e","//host","a\\b","",null]) expect(validBetaIdentity(invalid)).toBe(false);
    await expect(readPrivateBetaDetail("manhwa-list","https://other.example")).rejects.toThrow("PRIVATE_BETA_INVALID_ID");
    expect(getStagedKeiyoushiSource).not.toHaveBeenCalled();
  });
  it("inherits rating from a strong canonical identity, not a title-only guess", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const adapter=fixture();
    adapter.getDetail.mockResolvedValue({id:"manga",title:"Fixture",contentRating:"unknown",format:"manhwa",externalWorkIds:{anilist:"100"}} as any);
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    const canonical={provider:"mangabaka" as const,externalId:1,title:"Fixture",aliases:["Fixture"],format:"manhwa" as const,contentRating:"safe" as const,externalWorkIds:{anilist:"100"}};
    vi.mocked(matchMangaBakaWorks).mockResolvedValueOnce([canonical]);
    expect((await readPrivateBetaDetail("manhwa-list","manga")).chapters[0].readable).toBe(true);
    vi.mocked(matchMangaBakaWorks).mockResolvedValueOnce([{...canonical,externalWorkIds:{anilist:"101"}}]);
    await expect(readPrivateBetaDetail("manhwa-list","manga")).rejects.toThrow("PRIVATE_BETA_DETAIL_UNAVAILABLE");
    vi.mocked(matchMangaBakaWorks).mockResolvedValueOnce([{...canonical,contentRating:"erotica"}]);
    await expect(readPrivateBetaDetail("manhwa-list","manga")).rejects.toThrow("PRIVATE_BETA_DETAIL_UNAVAILABLE");
  });
  it("does not let an explicit safe source label override restrictive verified canonical evidence",async()=>{
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const adapter=fixture();
    adapter.getDetail.mockResolvedValue({id:"manga",title:"Fixture",contentRating:"safe",format:"manhwa",externalWorkIds:{anilist:"100"}} as any);
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    vi.mocked(matchMangaBakaWorks).mockResolvedValueOnce([{provider:"mangabaka",externalId:1,title:"Fixture",aliases:["Fixture"],format:"manhwa",contentRating:"suggestive",externalWorkIds:{anilist:"100"}}]);
    await expect(readPrivateBetaDetail("manhwa-list","manga")).rejects.toThrow("PRIVATE_BETA_DETAIL_UNAVAILABLE");
    expect(adapter.getChapters).not.toHaveBeenCalled();
  });
  it("rejects conflicting duplicate access evidence before requesting pages", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const adapter=fixture();
    adapter.getChapters.mockResolvedValue([
      {id:"chapter-1",mangaId:"manga",title:"Chapter 1",isLocked:false},
      {id:"chapter-1",mangaId:"manga",title:"Chapter 1",isLocked:true},
    ]);
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    await expect(readPrivateBetaChapter("owner","manhwa-list","manga","chapter-1")).rejects.toThrow("PRIVATE_BETA_SCHEMA_CHANGED");
    expect(adapter.getPages).not.toHaveBeenCalled();
  });
  it("requires explicit unlocked status and matching parent before resolving pages", async () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    const adapter=fixture();vi.mocked(getStagedKeiyoushiSource).mockReturnValue(adapter as any);
    expect((await readPrivateBetaDetail("manhwa-list","manga")).chapters.map(c=>[c.id,c.readable])).toEqual([["chapter-1",true],["locked",false],["unknown",false]]);
    for(const id of ["locked","unknown","foreign","missing"]) await expect(readPrivateBetaChapter("owner","manhwa-list","manga",id)).rejects.toThrow("PRIVATE_BETA_CHAPTER_UNAVAILABLE");
    expect(adapter.getPages).not.toHaveBeenCalled();
    const result=await readPrivateBetaChapter("owner","manhwa-list","manga","chapter-1");
    expect(result.pages).toHaveLength(1);
    const ticket=result.pages[0];
    expect(verifyBetaPageTicket(ticket,"owner")?.url).toBe("https://cdn.example.test/page.jpg");
    expect(verifyBetaPageTicket(ticket,"other")).toBeNull();
    expect(verifyBetaPageTicket(ticket+"0","owner")).toBeNull();
    vi.mocked(safeFetch).mockResolvedValue(new Response(new Uint8Array([1,2,3]),{headers:{"Content-Type":"image/jpeg"}}));
    expect(await fetchPrivateBetaPage(ticket,"other",new AbortController().signal)).toBeNull();
    expect(safeFetch).not.toHaveBeenCalled();
    const response=await fetchPrivateBetaPage(ticket,"owner",new AbortController().signal);
    expect(response?.headers.get("cache-control")).toContain("no-store");
    expect(safeFetch).toHaveBeenCalledWith("https://cdn.example.test/page.jpg",expect.objectContaining({maxRedirects:0,maxSize:10*1024*1024}));
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","");
    expect(verifyBetaPageTicket(ticket,"owner")).toBeNull();
  });
});

describe("private beta deployed catalog integration",()=>{
  it("classifies a bounded listing with one Turso batch, retaining ambiguity and restrictive evidence",async()=>{
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","manhwa-list");
    vi.stubEnv("YOMIRRA_MANGABAKA_INDEX_PATH","");
    vi.mocked(isTursoCatalogEnabled).mockReturnValue(true);
    const source={id:"manhwa-list",isEnabled:false,isNsfw:false,getPopular:vi.fn().mockResolvedValue({mangas:[
      {id:"one",title:"One",format:"manhwa",author:"Writer",contentRating:"unknown"},
      {id:"two",title:"Two",format:"manhwa",author:"Writer",contentRating:"unknown"},
      {id:"three",title:"Three",format:"manhwa",author:"Writer",contentRating:"safe"},
      {id:"hidden",title:"Hidden",contentRating:"suggestive"}
    ],hasNextPage:false})};
    vi.mocked(getStagedKeiyoushiSource).mockReturnValue(source as any);
    const canonical=(externalId:number,title:string,contentRating:"safe"|"suggestive"="safe")=>({provider:"mangabaka" as const,externalId,title,aliases:[title],format:"manhwa" as const,authors:["Writer"],contentRating});
    vi.mocked(lookupTursoCatalogBatch).mockResolvedValueOnce([[canonical(1,"One")],[canonical(2,"Two"),canonical(4,"Two")],[canonical(3,"Three","suggestive")]]);
    expect((await readPrivateBetaCatalog("manhwa-list","")).items.map(m=>m.id)).toEqual(["one"]);
    expect(lookupTursoCatalogBatch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(lookupTursoCatalogBatch).mock.calls[0][0].map(m=>m.id)).toEqual(["one","two","three"]);
    expect(matchMangaBakaWorks).not.toHaveBeenCalled();
  });
});
