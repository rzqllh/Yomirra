// @vitest-environment node
import {beforeEach,afterEach,it,expect,vi} from "vitest";
const state=vi.hoisted(()=>({get:vi.fn(),allowed:true}));
vi.mock("@/server/lib/cache/redis",()=>({isRedisConfigured:true,isRedisCommandAllowed:()=>state.allowed,redis:{get:state.get}}));
import {currentTursoCatalog,resetCatalogPointerForTests} from "../catalog-pointer";
const primary="a".repeat(64),standby="b".repeat(64);
beforeEach(()=>{
  vi.resetAllMocks();resetCatalogPointerForTests();state.allowed=true;
  for(const [key,value] of Object.entries({
    YOMIRRA_MANGABAKA_METADATA:"permitted",YOMIRRA_TURSO_FREE_CONFIRMED:"yes",
    YOMIRRA_TURSO_POINTER_ENABLED:"yes",YOMIRRA_TURSO_URL:"https://primary-fixture.turso.io",
    YOMIRRA_TURSO_READ_TOKEN:"primary-secret",YOMIRRA_TURSO_SNAPSHOT:primary,
    YOMIRRA_TURSO_STANDBY_URL:"https://standby-fixture.turso.io",
    YOMIRRA_TURSO_STANDBY_READ_TOKEN:"standby-secret",YOMIRRA_TURSO_STANDBY_SNAPSHOT:standby
  }))vi.stubEnv(key,value);
});
afterEach(()=>{vi.unstubAllEnvs();vi.useRealTimers();resetCatalogPointerForTests();});
it("retains original config without opt-in and rejects partial standby config",async()=>{
  vi.stubEnv("YOMIRRA_TURSO_POINTER_ENABLED","");
  expect((await currentTursoCatalog())?.snapshot).toBe(primary);
  expect(state.get).not.toHaveBeenCalled();
  vi.stubEnv("YOMIRRA_TURSO_POINTER_ENABLED","yes");
  vi.stubEnv("YOMIRRA_TURSO_STANDBY_READ_TOKEN","");
  expect(await currentTursoCatalog()).toBeNull();
});
it("observes atomic slot changes and rollback with bounded refresh",async()=>{
  vi.useFakeTimers();state.get.mockResolvedValueOnce(null).mockResolvedValueOnce(standby).mockResolvedValueOnce(primary);
  expect((await currentTursoCatalog())?.snapshot).toBe(primary);
  expect((await currentTursoCatalog())?.snapshot).toBe(primary);
  expect(state.get).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(30001);
  expect((await currentTursoCatalog())?.token).toBe("standby-secret");
  vi.advanceTimersByTime(30001);
  expect((await currentTursoCatalog())?.token).toBe("primary-secret");
  expect(state.get).toHaveBeenCalledTimes(3);
});
it("fails closed for unknown pointer and unavailable Redis",async()=>{
  state.get.mockResolvedValueOnce("https://untrusted.example");
  expect(await currentTursoCatalog()).toBeNull();
  resetCatalogPointerForTests();state.get.mockRejectedValueOnce(Error("offline"));
  expect(await currentTursoCatalog()).toBeNull();
  state.allowed=false;
  expect(await currentTursoCatalog()).toBeNull();
});
it("accepts regional Turso Cloud hostnames for primary and standby slots",async()=>{
  vi.stubEnv("YOMIRRA_TURSO_URL","libsql://primary-fixture.aws-ap-southeast-1.turso.io");
  vi.stubEnv("YOMIRRA_TURSO_STANDBY_URL","libsql://standby-fixture.aws-ap-southeast-1.turso.io");
  state.get.mockResolvedValueOnce(standby);
  const active=await currentTursoCatalog();
  expect(active?.origin).toBe("https://standby-fixture.aws-ap-southeast-1.turso.io");
  expect(active?.snapshot).toBe(standby);
});
