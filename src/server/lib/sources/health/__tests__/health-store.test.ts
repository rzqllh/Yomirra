import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceHealthStore } from "../health-store";
import type { SourceHealthSnapshot } from "../types";

vi.mock("@/server/lib/cache/redis", () => ({
  redis: null,
}));

describe("SourceHealthStore", () => {
  let store: SourceHealthStore;

  beforeEach(() => {
    store = new SourceHealthStore();
  });

  it("stores snapshot and tracks consecutive failures", async () => {
    const snap1: SourceHealthSnapshot = {
      sourceId: "komikindo",
      status: "BROKEN",
      stage: "search",
      latencyMs: 150,
      resolvedHost: "https://komikindo.ch",
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: null,
      lastFailureAt: new Date().toISOString(),
      consecutiveFailures: 1,
      lastFailureCode: "ROUTE_CHANGED",
    };

    const t1 = await store.recordSnapshot(snap1);
    expect(t1).toBeDefined();
    expect(t1?.event).toBe("SOURCE_BROKEN");

    const retrieved1 = await store.getSnapshot("komikindo");
    expect(retrieved1?.consecutiveFailures).toBe(1);

    // Second failure increases consecutiveFailures to 2
    const snap2: SourceHealthSnapshot = { ...snap1 };
    await store.recordSnapshot(snap2);

    const retrieved2 = await store.getSnapshot("komikindo");
    expect(retrieved2?.consecutiveFailures).toBe(2);
  });

  it("resets consecutive failures to 0 on recovery and emits SOURCE_RECOVERED", async () => {
    const brokenSnap: SourceHealthSnapshot = {
      sourceId: "komikindo",
      status: "BROKEN",
      latencyMs: 200,
      resolvedHost: "https://komikindo.ch",
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: null,
      lastFailureAt: new Date().toISOString(),
      consecutiveFailures: 1,
      lastFailureCode: "PARSER_BROKEN",
    };
    await store.recordSnapshot(brokenSnap);

    const healthySnap: SourceHealthSnapshot = {
      sourceId: "komikindo",
      status: "HEALTHY",
      latencyMs: 120,
      resolvedHost: "https://komikindo.ch",
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: new Date().toISOString(),
      lastFailureAt: null,
      consecutiveFailures: 0,
    };

    const transition = await store.recordSnapshot(healthySnap);

    expect(transition).toBeDefined();
    expect(transition?.event).toBe("SOURCE_RECOVERED");
    expect(transition?.previousStatus).toBe("BROKEN");
    expect(transition?.currentStatus).toBe("HEALTHY");

    const recovered = await store.getSnapshot("komikindo");
    expect(recovered?.consecutiveFailures).toBe(0);
    expect(recovered?.lastSuccessAt).toBeDefined();
  });

  it("fires registered onTransition listeners", async () => {
    const listener = vi.fn();
    store.onTransition(listener);

    const brokenSnap: SourceHealthSnapshot = {
      sourceId: "shinigami",
      status: "BROKEN",
      latencyMs: 200,
      resolvedHost: "https://api.shngm.io",
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: null,
      lastFailureAt: new Date().toISOString(),
      consecutiveFailures: 1,
      lastFailureCode: "SOURCE_DOWN",
    };

    await store.recordSnapshot(brokenSnap);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: "shinigami",
        event: "SOURCE_BROKEN",
        currentStatus: "BROKEN",
      })
    );
  });
});
