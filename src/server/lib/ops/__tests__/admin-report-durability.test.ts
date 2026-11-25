// @vitest-environment node
import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({eval:vi.fn(),lrange:vi.fn(),ready:vi.fn()}));
vi.mock("@/server/lib/cache/redis",()=>({isRedisConfigured:true,ensureRedisReady:state.ready,redis:{eval:state.eval,lrange:state.lrange}}));
vi.mock("@/shared/logger",()=>({logger:{warn:vi.fn()}}));
import {enqueueUserReport,getStoredUserReports,updateReportStatus} from "../admin-report-service";
beforeEach(()=>{vi.resetAllMocks();state.ready.mockResolvedValue(undefined);});
describe("durable report list",()=>{
  it("retains existing schema and performs append+existing retention in one atomic call",async()=>{
    state.eval.mockResolvedValueOnce(1);
    const row=await enqueueUserReport({type:"other",category:"Fixture"});
    expect(row.status).toBe("pending");
    expect(state.eval).toHaveBeenCalledTimes(1);
    const [sql,count,key,json]=state.eval.mock.calls[0];
    expect(sql).toContain("LPUSH");expect(sql).toContain("LTRIM");expect(sql).not.toContain("DEL");
    expect(count).toBe(1);expect(key).toBe("yomirra:reports:list");expect(JSON.parse(json)).toEqual(row);
  });
  it("updates only a matching report inside a single atomic Redis call",async()=>{
    const row={id:"rep_fixture",status:"resolved",resolvedAt:"2026-11-25T00:00:00Z"};
    state.eval.mockResolvedValueOnce(JSON.stringify(row));
    expect(await updateReportStatus(row.id,"resolved")).toEqual(row);
    expect(state.lrange).not.toHaveBeenCalled();
    const [sql,count,key,id,status]=state.eval.mock.calls[0];
    expect(sql).toContain("LSET");expect(sql).not.toContain("DEL");expect(sql).not.toContain("LPUSH");
    expect([count,key,id,status]).toEqual([1,"yomirra:reports:list",row.id,"resolved"]);
    state.eval.mockResolvedValueOnce(null);
    expect(await updateReportStatus("missing","pending")).toBeNull();
  });
  it("does not fabricate successful writes or an empty inbox on unavailable storage",async()=>{
    state.ready.mockRejectedValue(Error("offline"));
    await expect(enqueueUserReport({type:"other",category:"Fixture"})).rejects.toThrow("REPORT_STORAGE_UNAVAILABLE");
    await expect(getStoredUserReports()).rejects.toThrow("REPORT_STORAGE_UNAVAILABLE");
    await expect(updateReportStatus("rep_fixture","resolved")).rejects.toThrow("REPORT_STORAGE_UNAVAILABLE");
    expect(state.eval).not.toHaveBeenCalled();
  });
});
