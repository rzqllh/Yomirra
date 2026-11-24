import {beforeEach,describe,it,expect,vi} from "vitest";
const state=vi.hoisted(()=>({verify:vi.fn(),enqueue:vi.fn(),send:vi.fn(),format:vi.fn()}));
vi.mock("@/env",()=>({env:{NEXT_PUBLIC_APP_URL:"https://example.test"}}));
vi.mock("@/shared/logger",()=>({logger:{warn:vi.fn()}}));
vi.mock("@/server/lib/security/turnstile",()=>({verifyReportChallenge:state.verify}));
vi.mock("@/server/lib/security/rate-limit",()=>({checkRateLimitPolicy:async()=>({success:true,headers:{}}),applyRateLimitHeaders:(r:Response)=>r,createRateLimitRejection:()=>new Response(null,{status:429})}));
vi.mock("@/server/lib/ops/admin-report-service",()=>({enqueueUserReport:state.enqueue}));
vi.mock("@/server/lib/ops/telegram-notifier",()=>({sendTelegramMessage:state.send}));
vi.mock("@/server/lib/ops/message-format",()=>({formatUserReport:state.format}));
import {POST} from "./route";
const valid={type:"source_broken",category:"Fixture",sourceId:"fixture",turnstileToken:"test-token"};
const request=(body:unknown)=>new Request("https://example.test/api/ops/report",{method:"POST",headers:{origin:"https://example.test","Content-Type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();state.verify.mockResolvedValue("ok");state.enqueue.mockResolvedValue({});state.send.mockResolvedValue(true);state.format.mockReturnValue("fixture")});
describe("report challenge boundary",()=>{
  it("rejects invalid or oversized payloads before verification and side effects",async()=>{
    for(const body of [null,{...valid,detail:123},{...valid,type:"bad"},{...valid,detail:"x".repeat(9000)}])expect((await POST(request(body))).status).toBe(400);
    expect(state.verify).not.toHaveBeenCalled();expect(state.enqueue).not.toHaveBeenCalled();expect(state.send).not.toHaveBeenCalled();
  });
  it("requires verification before either inbox or Telegram writes",async()=>{
    state.verify.mockResolvedValueOnce("invalid").mockResolvedValueOnce("unavailable");
    expect((await POST(request(valid))).status).toBe(403);
    expect((await POST(request(valid))).status).toBe(503);
    expect(state.enqueue).not.toHaveBeenCalled();expect(state.send).not.toHaveBeenCalled();
  });
  it("never passes tokens or extra fields to report storage or formatting",async()=>{
    const res=await POST(request({...valid,unexpected:"secret"}));
    expect(res.status).toBe(200);
    const clean={type:"source_broken",category:"Fixture",sourceId:"fixture"};
    expect(state.verify).toHaveBeenCalledWith("test-token","https://example.test");
    expect(state.enqueue).toHaveBeenCalledWith(clean);expect(state.format).toHaveBeenCalledWith(clean);
  });
});
