// @vitest-environment node
import {describe,it,expect,vi,afterEach} from "vitest";
import {lookupTursoCatalog,getTursoMetadataWork} from "../turso-catalog";
import {reserveCatalogRequest} from "../catalog-budget";
import {encodeCatalogPayload} from "../catalog-payload.mjs";
vi.mock("../catalog-budget",()=>({reserveCatalogRequest:vi.fn()}));
vi.mock("@/server/lib/cache/redis-cache",()=>({withCache:async(_k:string,load:()=>Promise<unknown>)=>load()}));
const snapshot="a".repeat(64);
const work={provider:"mangabaka" as const,externalId:1995,title:"Fixture",aliases:["Fixture"],format:"manga" as const,contentRating:"safe" as const};
const cell=(value:string)=>({type:"text",value});
const blob={type:"blob",base64:encodeCatalogPayload(work).toString("base64")};
function configure(){
  vi.stubEnv("YOMIRRA_MANGABAKA_METADATA","permitted");
  vi.stubEnv("YOMIRRA_TURSO_FREE_CONFIRMED","yes");
  vi.stubEnv("YOMIRRA_TURSO_URL","libsql://fixture-test.turso.io");
  vi.stubEnv("YOMIRRA_TURSO_READ_TOKEN","fixture-read-only");
  vi.stubEnv("YOMIRRA_TURSO_SNAPSHOT",snapshot);
  vi.mocked(reserveCatalogRequest).mockResolvedValue(true);
}
function result(rows:unknown[][]){return {type:"ok",response:{type:"execute",result:{rows}}}}
function response(...buckets:unknown[][][]){
  return new Response(JSON.stringify({results:[result([["2",new Date().toISOString(),"CC-BY-NC-SA-4.0","mangabaka",snapshot].map(cell)]),...buckets.map(result),{type:"ok",response:{type:"close"}}]}));
}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.clearAllMocks();});
describe("Turso optional catalog",()=>{
  it("does not request without confirmed plan and admission",async()=>{
    configure();const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
    vi.stubEnv("YOMIRRA_TURSO_FREE_CONFIRMED","");
    expect(await lookupTursoCatalog("Fixture")).toBeNull();
    vi.stubEnv("YOMIRRA_TURSO_FREE_CONFIRMED","yes");
    vi.mocked(reserveCatalogRequest).mockResolvedValue(false);
    expect(await lookupTursoCatalog("Fixture")).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses one bounded parameterized pipeline for exact and discovery",async()=>{
    configure();const fetcher=vi.fn().mockResolvedValue(response([[blob]],[[blob],[blob]]));vi.stubGlobal("fetch",fetcher);
    expect(await lookupTursoCatalog("Fixture",undefined,true)).toEqual({works:[work],discovery:[work]});
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("https://fixture-test.turso.io/v2/pipeline");
    const sent=JSON.parse(fetcher.mock.calls[0][1].body);
    expect(sent.requests[1].stmt.args).toEqual([{type:"text",value:"title:fixture"}]);
    expect(sent.requests.at(-1)).toEqual({type:"close"});
  });
  it("never sends a token to an unrelated host",async()=>{
    configure();vi.stubEnv("YOMIRRA_TURSO_URL","https://fixture.turso.io.other.example/");
    const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
    expect(await lookupTursoCatalog("Fixture")).toBeNull();expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects ambiguous buckets and returns exact safe detail only",async()=>{
    configure();const fetcher=vi.fn().mockResolvedValueOnce(response(Array.from({length:17},()=>[blob]))).mockResolvedValueOnce(response([[blob]]));
    vi.stubGlobal("fetch",fetcher);
    expect(await lookupTursoCatalog("Fixture")).toEqual({works:[],discovery:[]});
    expect(await getTursoMetadataWork(1995)).toEqual(work);
  });
});
