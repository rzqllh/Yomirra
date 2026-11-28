import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import type {AlertState} from "../alert-state";
const state=vi.hoisted(()=>({value:null as AlertState|null,send:vi.fn()}));
vi.mock("@/env",()=>({env:{TELEGRAM_BOT_TOKEN:"test-token",TELEGRAM_CHAT_ID:"test-chat"}}));
vi.mock("@/shared/logger",()=>({logger:{info:vi.fn(),warn:vi.fn(),error:vi.fn()}}));
vi.mock("../alert-state",()=>({
  getAlertState:async()=>state.value?{...state.value}:null,
  saveAlertState:async(value:AlertState)=>{state.value={...value}}
}));
import {sendTelegramMessage} from "../telegram-notifier";
import {AlertSeverity} from "../severity";

const critical={severity:AlertSeverity.CRITICAL,fingerprint:"fixture",event:"PARSER_BROKEN",isManualTest:true};
const recovery={severity:AlertSeverity.RECOVERY,fingerprint:"fixture",isManualTest:true};
beforeEach(()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-25T00:00:00Z"));
  state.value=null;state.send.mockReset();vi.stubGlobal("fetch",state.send);
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe("Telegram delivery state",()=>{
  it("does not mark failed sends as delivered; retries after a short cooldown",async()=>{
    state.send.mockResolvedValueOnce(new Response("unavailable",{status:503}));
    expect(await sendTelegramMessage("fixture",critical)).toBe(false);
    expect(state.value?.alertedAt).toBeNull();
    expect(state.value?.cooldownUntil).toBe("2026-11-25T00:01:00.000Z");
    expect(await sendTelegramMessage("fixture",critical)).toBe(false);
    expect(state.send).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-11-25T00:01:01Z"));
    state.send.mockResolvedValueOnce(new Response('{"ok":true}'));
    expect(await sendTelegramMessage("fixture",critical)).toBe(true);
    expect(state.value?.alertedAt).toBe("2026-11-25T00:01:01.000Z");
    expect(state.value?.cooldownUntil).toBe("2026-11-25T00:31:01.000Z");
  });
  it("does not emit recovery for an incident that was never delivered",async()=>{
    state.send.mockRejectedValueOnce(new Error("offline"));
    expect(await sendTelegramMessage("fixture",critical)).toBe(false);
    expect(await sendTelegramMessage("fixture",recovery)).toBe(false);
    expect(state.send).toHaveBeenCalledTimes(1);
    expect(state.value).toMatchObject({alertedAt:null,consecutiveFailures:0,cooldownUntil:null});
  });
  it("commits successful plain-text fallback and resets recovery state",async()=>{
    state.send.mockResolvedValueOnce(new Response("can't parse entities",{status:400})).mockResolvedValueOnce(new Response('{"ok":true}'));
    expect(await sendTelegramMessage("fixture",critical)).toBe(true);
    expect(state.value?.alertedAt).not.toBeNull();
    state.send.mockResolvedValueOnce(new Response("can't parse entities",{status:400})).mockResolvedValueOnce(new Response('{"ok":true}'));
    expect(await sendTelegramMessage("fixture",recovery)).toBe(true);
    expect(state.value).toMatchObject({alertedAt:null,consecutiveFailures:0,cooldownUntil:null});
    expect(state.send).toHaveBeenCalledTimes(4);
  });
});
