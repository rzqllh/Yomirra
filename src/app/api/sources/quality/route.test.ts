import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
const state=vi.hoisted(()=>({allowed:true,reserve:vi.fn(),mget:vi.fn(),overrides:vi.fn()}));
vi.mock("@/server/lib/security/rate-limit",()=>({
  checkRateLimitPolicy:async()=>({success:true,headers:{}}),
  applyRateLimitHeaders:(response:Response)=>response,
  createRateLimitRejection:()=>new Response(null,{status:429})
}));
vi.mock("@/server/lib/cache/redis",()=>({isRedisConfigured:true,isRedisCommandAllowed:()=>state.allowed,redis:{mget:state.mget}}));
vi.mock("@/server/lib/cache/optional-service-budget",()=>({reserveOptionalService:state.reserve}));
vi.mock("@/server/lib/cache/redis-cache",()=>({CACHE_TTL:{DETAIL:86400,CHAPTERS:1800}}));
vi.mock("@/server/lib/sources/admin-source-service",()=>({getDurableCoreSourceOverrides:state.overrides}));
vi.mock("@/server/lib/sources/source-manager",()=>({sourceManager:{getAllSources:()=>[
  {id:"public-a",isDynamic:false,isNsfw:false},{id:"public-b",isDynamic:false,isNsfw:false},
  {id:"restricted",isDynamic:false,isNsfw:true},{id:"dynamic",isDynamic:true,isNsfw:false}
]}}));
vi.mock("@/server/lib/sources/content-access",()=>({
  getRequestReadOptions:()=>({hideNsfw:true}),
  assertSourceAccess:()=>{},
  contentCacheKey:(source:{id:string},operation:string,id:string,options:{hideNsfw:boolean})=>JSON.stringify([source.id,operation,id,options.hideNsfw])
}));
import {POST} from "./route";
const request=(body:unknown)=>new NextRequest("https://example.test/api/sources/quality?hideNsfw=false",{method:"POST",body:JSON.stringify(body)});
const refs=[{sourceId:"public-a",mangaId:"one"},{sourceId:"public-b",mangaId:"two"}];
const cache=(data:unknown)=>JSON.stringify({data,expiresAt:Date.now()+1000});
const detail=(id:string,rating="safe")=>cache({id,contentRating:rating});
const chapters=(id:string)=>cache([{id:"private-id",mangaId:id,title:"Chapter 1",isLocked:false,url:"https://example.test/private"}]);
beforeEach(()=>{vi.clearAllMocks();state.allowed=true;state.reserve.mockResolvedValue(true);state.overrides.mockResolvedValue({});state.mget.mockResolvedValue([detail("one"),chapters("one"),detail("two"),chapters("two")]);});
describe("public shared SQS cache endpoint",()=>{
  it("only reads exact safe-scope built-in cache and returns bounded numeric evidence",async()=>{
    const res=await POST(request([...refs,{sourceId:"restricted",mangaId:"adult"},{sourceId:"dynamic",mangaId:"custom"}]));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(state.mget.mock.calls[0]).toEqual([JSON.stringify(["public-a","manga","one",true]),JSON.stringify(["public-a","chapters","one",true]),JSON.stringify(["public-b","manga","two",true]),JSON.stringify(["public-b","chapters","two",true])]);
    const body=await res.json();
    expect(body.data[JSON.stringify(["public-a","one"])].labels).toEqual(["Chapter 1"]);
    expect(JSON.stringify(body)).not.toContain("private-id");
    expect(JSON.stringify(body)).not.toContain("example.test");
  });
  it("does not read cache when admission or authoritative source eligibility fails",async()=>{
    state.reserve.mockResolvedValueOnce(false);
    expect((await (await POST(request(refs))).json()).data).toEqual({});
    expect(state.mget).not.toHaveBeenCalled();
    state.overrides.mockResolvedValueOnce({"public-b":{isEnabled:false}});
    expect((await (await POST(request(refs))).json()).data).toEqual({});
    expect(state.mget).not.toHaveBeenCalled();
  });
  it("rejects oversized batches and restricted or unclassified detail",async()=>{
    expect((await POST(request(Array.from({length:9},()=>refs[0])))).status).toBe(400);
    expect(state.reserve).not.toHaveBeenCalled();
    state.mget.mockResolvedValueOnce([detail("one","unknown"),chapters("one"),detail("two","suggestive"),chapters("two")]);
    expect((await (await POST(request(refs))).json()).data).toEqual({});
  });
});
