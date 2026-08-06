import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUpdateChecker } from "../use-update-checker";
import { useSettingsStore } from "@/shared/store/settings-store";
import * as updateCheckerLib from "@/shared/lib/update-checker";

vi.mock("@/shared/lib/update-checker", () => ({
  scanLibraryUpdates: vi.fn(),
}));

describe("useUpdateChecker Integration with Preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      checkOnAppStart: true,
      minimumCheckIntervalMinutes: 15,
    });
  });

  it("app-start scan berjalan saat enabled", async () => {
    const options = { checkOnMount: true };
    const { result } = renderHook(() => useUpdateChecker(options));
    
    // In React 18 StrictMode or just regular testing, we wait for the effect to settle
    await act(async () => {
      // wait for internal state updates to flush
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(updateCheckerLib.scanLibraryUpdates).toHaveBeenCalled();
    expect(updateCheckerLib.scanLibraryUpdates).toHaveBeenCalledWith(
      expect.objectContaining({ forceRefresh: false })
    );
  });

  it("app-start scan tidak berjalan saat disabled", () => {
    useSettingsStore.setState({ checkOnAppStart: false });
    renderHook(() => useUpdateChecker({ checkOnMount: true }));
    expect(updateCheckerLib.scanLibraryUpdates).not.toHaveBeenCalled();
  });

  it("manual scan tetap berjalan saat app-start disabled", async () => {
    useSettingsStore.setState({ checkOnAppStart: false });
    const { result } = renderHook(() => useUpdateChecker({ checkOnMount: true }));
    
    expect(updateCheckerLib.scanLibraryUpdates).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.triggerScan();
    });

    expect(updateCheckerLib.scanLibraryUpdates).toHaveBeenCalledTimes(1);
  });

  it("custom interval diteruskan ke checker dalam milliseconds", async () => {
    useSettingsStore.setState({ minimumCheckIntervalMinutes: 30 });
    const { result } = renderHook(() => useUpdateChecker());

    await act(async () => {
      await result.current.triggerScan();
    });

    expect(updateCheckerLib.scanLibraryUpdates).toHaveBeenCalledWith(
      expect.objectContaining({ cooldownMs: 30 * 60 * 1000 })
    );
  });

  it("invalid interval fallback ke 15 menit", async () => {
    useSettingsStore.setState({ minimumCheckIntervalMinutes: -5 });
    const { result } = renderHook(() => useUpdateChecker());

    await act(async () => {
      await result.current.triggerScan();
    });

    expect(updateCheckerLib.scanLibraryUpdates).toHaveBeenCalledWith(
      expect.objectContaining({ cooldownMs: 15 * 60 * 1000 })
    );
  });

  it("forceRefresh diteruskan untuk bypass cooldown", async () => {
    const { result } = renderHook(() => useUpdateChecker());

    await act(async () => {
      await result.current.triggerScan({ forceRefresh: true });
    });

    expect(updateCheckerLib.scanLibraryUpdates).toHaveBeenCalledWith(
      expect.objectContaining({ forceRefresh: true })
    );
  });
});
