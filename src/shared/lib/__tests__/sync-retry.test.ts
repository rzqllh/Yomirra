import { describe, expect, it } from "vitest";
import { nextSyncRetryDelayMs } from "../sync-retry";

describe("automatic sync retry backoff", () => {
  it("grows exponentially after consecutive failures", () => {
    expect(nextSyncRetryDelayMs(1, 0.5)).toBe(1_000);
    expect(nextSyncRetryDelayMs(2, 0.5)).toBe(2_000);
    expect(nextSyncRetryDelayMs(3, 0.5)).toBe(4_000);
    expect(nextSyncRetryDelayMs(7, 0.5)).toBe(60_000);
    expect(nextSyncRetryDelayMs(100, 0.5)).toBe(60_000);
  });

  it("bounds jitter and handles invalid counters without overflow", () => {
    expect(nextSyncRetryDelayMs(1, 0)).toBe(800);
    expect(nextSyncRetryDelayMs(1, 1)).toBe(1_200);
    expect(nextSyncRetryDelayMs(-100, 0.5)).toBe(1_000);
    expect(nextSyncRetryDelayMs(Number.POSITIVE_INFINITY, Number.NaN)).toBe(1_000);
  });
});
