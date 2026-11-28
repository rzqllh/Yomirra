import {beforeEach,afterEach,it,expect,vi} from "vitest";
const state=vi.hoisted(()=>({set:vi.fn(),allowed:true,fetch:vi.fn()}));
vi.mock("@/server/lib/cache/redis",()=>({isRedisConfigured:true,isRedisCommandAllowed:()=>state.allowed,redis:{set:state.set}}));
import {verifyReportChallenge} from "../turnstile";
const app="https://www.yomirra.web.id";
const success=()=>({success:true,hostname:"www.yomirra.web.id",action:"user_report",challenge_ts:new Date().toISOString()});
beforeEach(()=>{vi.resetAllMocks();state.allowed=true;state.set.mockResolvedValue("OK");vi.stubGlobal("fetch",state.fetch);vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY","site");vi.stubEnv("TURNSTILE_SECRET_KEY","secret");vi.stubEnv("YOMIRRA_REPORT_TURNSTILE_REQUIRED","");});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()});
it("leaves legacy reports unchanged only when intentionally unconfigured",async()=>{
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY","");vi.stubEnv("TURNSTILE_SECRET_KEY","");
  expect(await verifyReportChallenge(undefined,app)).toBe("ok");
  vi.stubEnv("YOMIRRA_REPORT_TURNSTILE_REQUIRED","yes");
  expect(await verifyReportChallenge(undefined,app)).toBe("unavailable");
  expect(state.fetch).not.toHaveBeenCalled();
});
it("fails closed on partial config, missing token and unavailable ledger",async()=>{
  expect(await verifyReportChallenge(undefined,app)).toBe("invalid");
  state.allowed=false;expect(await verifyReportChallenge("token",app)).toBe("unavailable");
  state.allowed=true;vi.stubEnv("TURNSTILE_SECRET_KEY","");
  expect(await verifyReportChallenge("token",app)).toBe("unavailable");
  expect(state.fetch).not.toHaveBeenCalled();
});
it("validates exact host/action/freshness and prevents replay",async()=>{
  for(const value of [{...success(),hostname:"wrong.test"},{...success(),action:"login"},{...success(),challenge_ts:"2000-01-01"},{success:false}]){
    state.fetch.mockResolvedValueOnce(Response.json(value));
    expect(await verifyReportChallenge("token",app)).toBe("invalid");
  }
  expect(state.set).not.toHaveBeenCalled();
  state.fetch.mockResolvedValueOnce(Response.json(success()));
  expect(await verifyReportChallenge("token",app)).toBe("ok");
  expect(state.set).toHaveBeenCalledWith(expect.stringMatching(/^yomirra:turnstile:report:[a-f0-9]{64}$/),"1","EX",310,"NX");
  state.set.mockResolvedValueOnce(null);state.fetch.mockResolvedValueOnce(Response.json(success()));
  expect(await verifyReportChallenge("token",app)).toBe("invalid");
  state.fetch.mockRejectedValueOnce(Error("offline"));
  expect(await verifyReportChallenge("token",app)).toBe("unavailable");
});
