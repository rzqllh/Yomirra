import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({allowed:true,eval:vi.fn(),get:vi.fn()}));
vi.mock("../redis",()=>({isRedisConfigured:true,isRedisCommandAllowed:()=>state.allowed,redis:{eval:state.eval,get:state.get}}));
import {reserveOptionalService,optionalServiceKey,OPTIONAL_SERVICE_CAPS,optionalServiceSummary} from "../optional-service-budget";
beforeEach(()=>{vi.clearAllMocks();state.allowed=true;state.eval.mockResolvedValue(1);});
afterEach(()=>vi.unstubAllEnvs());
describe("optional service free-only admissions",()=>{
  it("does not issue Gemini admission without verified free configuration",async()=>{
    vi.stubEnv("YOMIRRA_GEMINI_FREE_CONFIRMED","");
    expect(await reserveOptionalService("gemini")).toBe(false);
    expect(state.eval).not.toHaveBeenCalled();
  });
  it("uses separate UTC-day ledgers and stops on failure or exhaustion",async()=>{
    vi.stubEnv("YOMIRRA_GEMINI_FREE_CONFIRMED","yes");
    expect(optionalServiceKey("gemini",new Date("2026-11-24T23:59:59Z"))).toBe("yomirra:optional:admission:gemini:2026-11-24");
    expect(await reserveOptionalService("gemini")).toBe(true);
    expect(state.eval).toHaveBeenLastCalledWith(expect.any(String),1,expect.stringContaining(":gemini:"),OPTIONAL_SERVICE_CAPS.gemini);
    expect(await reserveOptionalService("mangabaka")).toBe(true);
    expect(state.eval).toHaveBeenLastCalledWith(expect.any(String),1,expect.stringContaining(":mangabaka:"),OPTIONAL_SERVICE_CAPS.mangabaka);
    state.eval.mockResolvedValueOnce(0).mockRejectedValueOnce(Error("quota"));
    expect(await reserveOptionalService("gemini")).toBe(false);
    expect(await reserveOptionalService("mangabaka")).toBe(false);
    state.allowed=false;
    expect(await reserveOptionalService("gemini")).toBe(false);
    expect(state.eval).toHaveBeenCalledTimes(4);
  });
  it("reports actual local count, not provider usage",async()=>{
    vi.stubEnv("YOMIRRA_GEMINI_FREE_CONFIRMED","yes");state.get.mockResolvedValue("80");
    expect(await optionalServiceSummary("gemini")).toContain("80/100");
    expect(await optionalServiceSummary("gemini")).toContain("mendekati batas");
  });
});

it("limits MangaUpdates independently and fails closed before network admission",async()=>{
  vi.stubEnv("YOMIRRA_MANGAUPDATES_METADATA","");
  expect(await reserveOptionalService("mangaupdates")).toBe(false);expect(state.eval).not.toHaveBeenCalled();
  vi.stubEnv("YOMIRRA_MANGAUPDATES_METADATA","permitted");
  expect(await reserveOptionalService("mangaupdates")).toBe(true);
  expect(state.eval).toHaveBeenLastCalledWith(expect.any(String),1,expect.stringContaining(":mangaupdates:"),100);
  state.eval.mockResolvedValueOnce(0);
  expect(await reserveOptionalService("mangaupdates")).toBe(false);
});

it("bounds shared chapter evidence independently of metadata APIs",async()=>{
  expect(await reserveOptionalService("sqs")).toBe(true);
  expect(state.eval).toHaveBeenLastCalledWith(expect.any(String),1,expect.stringContaining(":sqs:"),200);
  state.eval.mockResolvedValueOnce(0);expect(await reserveOptionalService("sqs")).toBe(false);
});
