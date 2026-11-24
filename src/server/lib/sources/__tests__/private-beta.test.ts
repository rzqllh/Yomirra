import { afterEach, describe, expect, it, vi } from "vitest";
import { privateBetaSources, privateBetaAllowsSource, readPrivateBetaCatalog, readPrivateBetaDetail, readPrivateBetaChapter, verifyBetaPageTicket, fetchPrivateBetaPage, validBetaIdentity } from "../private-beta";
import { getStagedKeiyoushiSource } from "../adapters/keiyoushi";
import { safeFetch } from "@/server/lib/security/outbound-policy";
vi.mock("@/env", () => ({env:{IMAGE_PROXY_SECRET:"fixture-secret-32-characters-only-for-tests"}}));
vi.mock("@/server/lib/security/outbound-policy", () => ({safeFetch:vi.fn()}));

vi.mock("../adapters/keiyoushi", () => ({getStagedKeiyoushiSource:vi.fn()}));
afterEach(() => {vi.unstubAllEnvs(); vi.clearAllMocks();});
describe("private beta scope", () => {
  it("defaults to no permitted live sources and excludes restricted/duplicate/prototype identities", () => {
    vi.stubEnv("YOMIRRA_PRIVATE_BETA_SOURCE_IDS","");
    expect(privateBetaSources().every(s => !s.available)).toBe(true);
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
