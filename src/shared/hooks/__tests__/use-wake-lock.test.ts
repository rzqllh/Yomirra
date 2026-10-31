import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWakeLock } from "../use-wake-lock";
import { useSettingsStore } from "@/shared/store/settings-store";

describe("download wake-lock preference", () => {
  beforeEach(() => useSettingsStore.setState({ keepScreenAwake: true }));
  afterEach(() => vi.unstubAllGlobals());

  it("releases an active screen lock immediately when the setting is disabled", async () => {
    const lock = { addEventListener: vi.fn(), release: vi.fn().mockResolvedValue(undefined) };
    vi.stubGlobal("navigator", { wakeLock: { request: vi.fn().mockResolvedValue(lock) } });
    const { result } = renderHook(() => useWakeLock());
    await act(() => result.current.request());
    expect(result.current.isActive).toBe(true);
    act(() => useSettingsStore.getState().setKeepScreenAwake(false));
    await waitFor(() => expect(lock.release).toHaveBeenCalledOnce());
    await waitFor(() => expect(result.current.isActive).toBe(false));
  });

  it("releases a lock granted after the user has disabled the setting", async () => {
    const lock = { addEventListener: vi.fn(), release: vi.fn().mockResolvedValue(undefined) };
    let grant!: (value: typeof lock) => void;
    vi.stubGlobal("navigator", { wakeLock: { request: vi.fn(() => new Promise((resolve) => { grant = resolve; })) } });
    const { result } = renderHook(() => useWakeLock());
    let pending!: Promise<void>;
    act(() => { pending = result.current.request(); });
    act(() => useSettingsStore.getState().setKeepScreenAwake(false));
    await act(async () => { grant(lock); await pending; });
    expect(lock.release).toHaveBeenCalledOnce();
    expect(result.current.isActive).toBe(false);
  });
});
