import {describe,it,expect,vi,afterEach} from "vitest";
import {reserveCatalogRequest,catalogBudgetKey,CATALOG_DAILY_CAP} from "../catalog-budget";
const state=vi.hoisted(()=>({allowed:true,eval:vi.fn()}));
vi.mock("@/server/lib/cache/redis",()=>({isRedisConfigured:true,isRedisCommandAllowed:()=>state.allowed,redis:{eval:state.eval}}));
afterEach(()=>{state.allowed=true;vi.clearAllMocks()});
describe("optional catalog quota admission",()=>{
  it("uses UTC day keys and a conservative shared cap",async()=>{
    state.eval.mockResolvedValue(1);
    expect(catalogBudgetKey(new Date("2026-11-24T23:59:59Z"))).toBe("yomirra:catalog:admission:2026-11-24");
    expect(await reserveCatalogRequest()).toBe(true);
    expect(state.eval).toHaveBeenCalledWith(expect.any(String),1,expect.stringContaining("yomirra:catalog:admission:"),CATALOG_DAILY_CAP);
  });
  it("stops optional remote work on cap, Redis failure or open circuit",async()=>{
    state.eval.mockResolvedValueOnce(0).mockRejectedValueOnce(Error("quota"));
    expect(await reserveCatalogRequest()).toBe(false);
    expect(await reserveCatalogRequest()).toBe(false);
    state.allowed=false;
    expect(await reserveCatalogRequest()).toBe(false);
    expect(state.eval).toHaveBeenCalledTimes(2);
  });
});
