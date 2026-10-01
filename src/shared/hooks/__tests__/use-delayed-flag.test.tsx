import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDelayedFlag } from "../use-delayed-flag";

describe("useDelayedFlag", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not flash feedback for a fast operation", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 180),
      { initialProps: { active: true } }
    );

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current).toBe(false);

    rerender({ active: false });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe(false);
  });

  it("shows feedback only after the configured delay", () => {
    const { result } = renderHook(() => useDelayedFlag(true, 180));

    act(() => {
      vi.advanceTimersByTime(179);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it("cleans up immediately when the operation completes", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 180),
      { initialProps: { active: true } }
    );

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);
  });
});
