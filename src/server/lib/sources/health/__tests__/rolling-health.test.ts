import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceHealthStore } from "../health-store";
import type { SourceHealthSnapshot } from "../types";
import { toPublicSourceHealth, createUnknownPublicSourceHealth } from "../public-health";

describe("Rolling Source Health & Uptime Engine", () => {
  let store: SourceHealthStore;

  beforeEach(async () => {
    vi.restoreAllMocks();
    store = new SourceHealthStore();
    await store.clear();
  });

  function createMockSnapshot(
    sourceId: string,
    status: SourceHealthSnapshot["status"],
    latencyMs: number,
    options: Partial<SourceHealthSnapshot> = {}
  ): SourceHealthSnapshot {
    return {
      sourceId,
      status,
      latencyMs,
      resolvedHost: `https://${sourceId}.example`,
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: status === "HEALTHY" ? new Date().toISOString() : null,
      lastFailureAt: status !== "HEALTHY" ? new Date().toISOString() : null,
      consecutiveFailures: status === "HEALTHY" ? 0 : 1,
      metadata: {
        totalParsed: 10,
        probeType: "lightweight",
      },
      ...options,
    };
  }

  it("handles insufficient data (< 3 samples) with honest '-' uptime and p95", async () => {
    // 1st sample
    await store.recordSnapshot(createMockSnapshot("shinigami", "HEALTHY", 120));
    // 2nd sample
    await store.recordSnapshot(createMockSnapshot("shinigami", "HEALTHY", 130));

    const stats = await store.getRollingStats("shinigami");
    expect(stats.totalSamples).toBe(2);
    expect(stats.successfulSamples).toBe(2);
    expect(stats.hasSufficientData).toBe(false);
    expect(stats.successRate).toBe("-");
    expect(stats.p95Latency).toBe("-");

    const snap = await store.getSnapshot("shinigami");
    expect(snap).not.toBeNull();
    const pub = toPublicSourceHealth(snap!, stats);
    expect(pub.uptime).toBe("-");
    expect(pub.status).toBe("online");
    expect(pub.hasSufficientData).toBe(false);
  });

  it("calculates accurate success rate and p95 latency once sufficient data (>= 3 samples) is collected", async () => {
    // 3 samples: 2 healthy (100ms, 200ms), 1 broken (500ms)
    await store.recordSnapshot(createMockSnapshot("komikindo", "HEALTHY", 100));
    await store.recordSnapshot(createMockSnapshot("komikindo", "BROKEN", 500, { lastFailureCode: "PARSER_BROKEN" }));
    await store.recordSnapshot(createMockSnapshot("komikindo", "HEALTHY", 200));

    const stats = await store.getRollingStats("komikindo");
    expect(stats.totalSamples).toBe(3);
    expect(stats.successfulSamples).toBe(2);
    expect(stats.hasSufficientData).toBe(true);
    // 2 / 3 = 66.7%
    expect(stats.successRate).toBe("66.7%");
    // successful latencies: [100, 200]. 95th percentile of 2 items: index 1 -> 200ms
    expect(stats.p95Latency).toBe("200ms");

    const snap = await store.getSnapshot("komikindo");
    const pub = toPublicSourceHealth(snap!, stats);
    expect(pub.uptime).toBe("66.7%");
    expect(pub.latency).toBe("200ms");
    expect(pub.hasSufficientData).toBe(true);
  });

  it("bounds rolling probe history to a maximum of 50 samples (FIFO eviction)", async () => {
    for (let i = 1; i <= 60; i++) {
      await store.recordSnapshot(createMockSnapshot("mangadex", "HEALTHY", 100 + i));
    }

    const stats = await store.getRollingStats("mangadex");
    expect(stats.totalSamples).toBe(50);
    expect(stats.successfulSamples).toBe(50);
    expect(stats.hasSufficientData).toBe(true);
    expect(stats.successRate).toBe("100.0%");
  });

  it("filters out probe samples outside the 24-hour retention window", async () => {
    // Manually record snapshot, but mock time to be 25 hours ago
    const now = Date.now();
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;

    vi.spyOn(Date, "now").mockReturnValue(twentyFiveHoursAgo);
    await store.recordSnapshot(createMockSnapshot("asurascans", "HEALTHY", 150));

    // Restore time to current
    vi.spyOn(Date, "now").mockReturnValue(now);
    await store.recordSnapshot(createMockSnapshot("asurascans", "HEALTHY", 160));

    const stats = await store.getRollingStats("asurascans", 24);
    // Only the sample within 24h should count
    expect(stats.totalSamples).toBe(1);
    expect(stats.hasSufficientData).toBe(false);
  });

  it("creates honest unknown status when no measurements exist", () => {
    const unknown = createUnknownPublicSourceHealth("unknown-source");
    expect(unknown.status).toBe("unknown");
    expect(unknown.uptime).toBe("-");
    expect(unknown.latency).toBe("-");
    expect(unknown.message).toBe("Sumber belum diperiksa.");
    expect(unknown.hasSufficientData).toBe(false);
  });
});
