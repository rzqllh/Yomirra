// @vitest-environment node
import {describe,it,expect,vi,afterEach,beforeEach} from "vitest";
const redisMock=vi.hoisted(()=>({configured:false,allowed:false,get:vi.fn()}));
const cacheStore=vi.hoisted(()=>new Map<string,unknown>());
vi.mock("../catalog-budget",()=>({reserveCatalogRequest:vi.fn()}));
vi.mock("@/server/lib/cache/redis",()=>({
  get isRedisConfigured(){return redisMock.configured;},
  isRedisCommandAllowed:()=>redisMock.allowed,
  redis:{get:redisMock.get},
}));
vi.mock("@/server/lib/cache/redis-cache",()=>({
  withCache:async(k:string,load:()=>Promise<unknown>)=>{
    if(cacheStore.has(k))return cacheStore.get(k);
    const val=await load();
    cacheStore.set(k,val);
    return val;
  },
}));
import {lookupTursoCatalog,getTursoMetadataWork,lookupTursoCatalogBatch} from "../turso-catalog";
import {reserveCatalogRequest} from "../catalog-budget";
import {resetCatalogFreshnessForTests} from "../catalog-freshness";
import {encodeCatalogPayload} from "../catalog-payload.mjs";
import {encodeCatalogFreshnessAttestation,MAX_CATALOG_FRESHNESS_MS} from "../catalog-slots.mjs";

const snapshot="a".repeat(64);
const work={provider:"mangabaka" as const,externalId:1995,title:"Fixture",aliases:["Fixture"],format:"manga" as const,contentRating:"safe" as const};
const cell=(value:string)=>({type:"text",value});
const blob={type:"blob",base64:encodeCatalogPayload(work).toString("base64")};
function configure(){
  vi.stubEnv("YOMIRRA_TURSO_POINTER_ENABLED","");
  vi.stubEnv("YOMIRRA_MANGABAKA_METADATA","permitted");
  vi.stubEnv("YOMIRRA_TURSO_FREE_CONFIRMED","yes");
  vi.stubEnv("YOMIRRA_TURSO_URL","libsql://fixture-test.turso.io");
  vi.stubEnv("YOMIRRA_TURSO_READ_TOKEN","fixture-read-only");
  vi.stubEnv("YOMIRRA_TURSO_SNAPSHOT",snapshot);
  vi.mocked(reserveCatalogRequest).mockResolvedValue(true);
}
function result(rows:unknown[][]){return {type:"ok",response:{type:"execute",result:{rows}}}}
function responseWithCreated(createdAt:string,...buckets:unknown[][][]){
  return new Response(JSON.stringify({results:[result([["2",createdAt,"CC-BY-NC-SA-4.0","mangabaka",snapshot].map(cell)]),...buckets.map(result),{type:"ok",response:{type:"close"}}]}));
}
function response(...buckets:unknown[][][]){
  return responseWithCreated(new Date().toISOString(),...buckets);
}
beforeEach(()=>{
  cacheStore.clear();
  redisMock.configured=false;
  redisMock.allowed=false;
  redisMock.get.mockReset();
  resetCatalogFreshnessForTests();
});
afterEach(()=>{
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
  cacheStore.clear();
  resetCatalogFreshnessForTests();
});
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
  it("accepts an unchanged >7-day snapshot with valid Redis freshness attestation and expires strictly after 7 days",async()=>{
    vi.useFakeTimers();
    const created="2026-11-10T00:00:00.000Z";
    const verified="2026-11-24T00:00:00.000Z";
    const now=Date.parse("2026-11-26T00:00:00.000Z");
    vi.setSystemTime(now);
    configure();
    redisMock.configured=true;
    redisMock.allowed=true;
    const {json}=encodeCatalogFreshnessAttestation({
      sourceSha256:snapshot,
      createdAt:created,
      lastVerifiedAt:verified,
      officialSha1:"1".repeat(40),
      now,
    });
    redisMock.get.mockResolvedValue(json);
    const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(responseWithCreated(created,[[blob]])));
    vi.stubGlobal("fetch",fetcher);

    expect(await lookupTursoCatalog("Fixture")).toEqual({works:[work],discovery:[]});
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Advance past the 7-day limit from last_verified_at: even cached result must fail closed.
    vi.setSystemTime(Date.parse(verified)+MAX_CATALOG_FRESHNESS_MS+1000);
    resetCatalogFreshnessForTests();
    expect(await lookupTursoCatalog("Fixture")).toBeNull();

    // Tampered/mismatched attestation is also rejected immediately.
    vi.setSystemTime(now);
    cacheStore.clear();
    resetCatalogFreshnessForTests();
    redisMock.get.mockResolvedValue(JSON.stringify({...JSON.parse(json),official_sha1:"invalid"}));
    expect(await lookupTursoCatalog("Fixture")).toBeNull();
  });
});

describe("bounded owner listing lookup",()=>{
  it("does not look up rows without strong identity or above the page bound",async()=>{
    configure();const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
    expect(await lookupTursoCatalogBatch([{id:"a",title:"Fixture",coverUrl:"",format:"manga"}])).toEqual([[]]);
    expect(await lookupTursoCatalogBatch(Array.from({length:25},()=>({id:"a",title:"Fixture",coverUrl:"",format:"manga",author:"Writer"})))).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("deduplicates keys, bounds admission and preserves restrictive competing candidates",async()=>{
    configure();
    const restricted={...work,externalId:2000,contentRating:"suggestive" as const};
    const other={type:"blob",base64:encodeCatalogPayload(restricted).toString("base64")};
    const fetcher=vi.fn().mockResolvedValue(response([[blob],[other]]));vi.stubGlobal("fetch",fetcher);
    const rows=[{id:"a",title:"Fixture",coverUrl:"",format:"manga",author:"Writer"},{id:"b",title:"Fixture",coverUrl:"",format:"manga",author:"Writer"}];
    expect(await lookupTursoCatalogBatch(rows)).toEqual([[work,restricted],[work,restricted]]);
    expect(fetcher).toHaveBeenCalledTimes(1);expect(reserveCatalogRequest).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetcher.mock.calls[0][1].body).requests).toHaveLength(3);
  });
  it("does not truncate an ambiguous bucket into a unique identity",async()=>{
    configure();const fetcher=vi.fn().mockResolvedValue(response(Array.from({length:5},()=>[blob])));vi.stubGlobal("fetch",fetcher);
    expect(await lookupTursoCatalogBatch([{id:"a",title:"Fixture",coverUrl:"",format:"manga",author:"Writer"}])).toEqual([[]]);
  });
});
