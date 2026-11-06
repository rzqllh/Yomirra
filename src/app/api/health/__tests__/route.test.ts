import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Command } from "ioredis";

const mockRedisPing = vi.fn();
const mockEnsureRedisReady = vi.fn();
const mockGetAllSnapshots = vi.fn();
const mockProbeAllSourcesHealth = vi.fn();
const redisState = vi.hoisted(() => ({
  configured: true,
  circuit: "closed" as "closed" | "open" | "half-open",
  probing: false,
  ready: true,
}));

vi.mock("@/server/lib/cache/redis", () => ({
  get isRedisConfigured() { return redisState.configured; },
  isRedisCircuitOpen: () => redisState.circuit !== "closed",
  isRedisCommandAllowed: () => redisState.circuit === "closed",
  isRedisReady: () => redisState.ready,
  ensureRedisReady: () => mockEnsureRedisReady(),
  redis: {
    sendCommand: (command: Command) => {
      void mockRedisPing(command).then(command.resolve, command.reject);
      return command.promise;
    },
  },
}));

vi.mock("@/server/lib/sources/health/health-store", () => ({
  sourceHealthStore: {
    getAllSnapshots: (...args: unknown[]) => mockGetAllSnapshots(...args),
  },
}));

// This dependency must NOT be called by /api/health.
vi.mock("@/server/lib/sources/health/probe", () => ({
  probeAllSourcesHealth: (...args: unknown[]) => mockProbeAllSourcesHealth(...args),
}));

vi.mock("@/shared/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

let GET: typeof import("../route").GET;

describe("GET /api/health readiness", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    redisState.configured = true;
    redisState.circuit = "closed";
    redisState.probing = false;
    redisState.ready = true;
    mockRedisPing.mockResolvedValue("PONG");
    mockEnsureRedisReady.mockResolvedValue(undefined);
    mockGetAllSnapshots.mockResolvedValue({});
    ({ GET } = await import("../route"));
  });

  it("returns sanitized recent observations without probing upstream providers", async () => {
    const checkedAt = new Date(Date.now() - 1000).toISOString();
    mockGetAllSnapshots.mockResolvedValue({
      shinigami: {
        sourceId: "shinigami",
        status: "HEALTHY",
        latencyMs: 90,
        lastCheckedAt: checkedAt,
      },
      doujindesu: {
        sourceId: "doujindesu",
        status: "BROKEN",
        latencyMs: 5,
        lastCheckedAt: checkedAt,
        lastFailureCode: "SOURCE_DOWN",
        errorMessage: "Restricted credential must not leak",
      },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("ok");
    expect(json.sourceObservations).toBe("recent-snapshots-only");
    expect(json.sources.shinigami).toEqual({ status: "ok", latencyMs: 90 });
    expect(json.sources.doujindesu).toEqual({
      status: "down",
      errorCode: "SOURCE_DOWN",
      error: "server sumber sedang tidak dapat dihubungi",
    });
    expect(JSON.stringify(json)).not.toContain("Restricted credential");
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("bounds Redis and upstream requests under repeated readiness polling", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await GET();
      expect(res.status).toBe(200);
    }
    expect(mockGetAllSnapshots).toHaveBeenCalledTimes(10);
    expect(mockRedisPing).toHaveBeenCalledOnce();
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });

  it("backs off after a failed probe and reports recovery after the window", async () => {
    vi.useFakeTimers();
    try {
      mockEnsureRedisReady.mockRejectedValueOnce(new Error("Redis connection refused"));
      expect((await GET()).status).toBe(503);
      await vi.advanceTimersByTimeAsync(9_999);
      expect((await GET()).status).toBe(503);
      expect(mockEnsureRedisReady).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(1);
      expect((await GET()).status).toBe(200);
      expect(mockEnsureRedisReady).toHaveBeenCalledTimes(2);
      expect(mockRedisPing).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not present a cached successful check once the quota circuit opens", async () => {
    expect((await GET()).status).toBe(200);
    redisState.circuit = "open";
    expect((await GET()).status).toBe(503);
    expect(mockRedisPing).toHaveBeenCalledOnce();
  });

  it("invalidates a cached PONG immediately on disconnect and reprobes after backoff", async () => {
    vi.useFakeTimers();
    try {
      expect((await GET()).status).toBe(200);
      redisState.ready = false;
      expect((await GET()).status).toBe(503);
      redisState.ready = true;
      expect((await GET()).status).toBe(503);
      expect(mockRedisPing).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(10_000);
      expect((await GET()).status).toBe(200);
      expect(mockRedisPing).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits for a cold Redis connection and shares the ping between concurrent requests", async () => {
    let ready!: () => void;
    mockEnsureRedisReady.mockImplementationOnce(() => new Promise<void>((resolve) => {
      ready = resolve;
    }));

    const first = GET();
    const second = GET();
    expect(mockEnsureRedisReady).toHaveBeenCalledOnce();
    expect(mockRedisPing).not.toHaveBeenCalled();

    ready();
    const responses = await Promise.all([first, second]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(mockRedisPing).toHaveBeenCalledOnce();
    expect(mockRedisPing).toHaveBeenCalledWith(expect.objectContaining({ name: "ping" }));
  });

  it("reports Redis down if the connection cannot become ready", async () => {
    mockEnsureRedisReady.mockRejectedValueOnce(new Error("Redis connection refused"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "degraded", redis: "down" });
    expect(mockRedisPing).not.toHaveBeenCalled();
  });

  it("reports Redis down when a ready connection stops responding", async () => {
    vi.useFakeTimers();
    try {
      mockRedisPing.mockImplementationOnce(() => new Promise(() => {}));
      const response = GET();
      await vi.advanceTimersByTimeAsync(1_500);
      expect((await response).status).toBe(503);
    } finally {
      vi.useRealTimers();
    }
  });

  it("omits stale or future-dated observations instead of calling them healthy", async () => {
    mockGetAllSnapshots.mockResolvedValue({
      stale: {
        sourceId: "stale",
        status: "HEALTHY",
        latencyMs: 30,
        lastCheckedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      },
      future: {
        sourceId: "future",
        status: "HEALTHY",
        latencyMs: 30,
        lastCheckedAt: new Date(Date.now() + 60 * 1000).toISOString(),
      },
    });
    const res = await GET();
    const json = await res.json();
    expect(json.sources).toEqual({});
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });

  it("preserves degraded Redis diagnostics without introducing source probes", async () => {
    mockRedisPing.mockRejectedValueOnce(new Error("Redis unavailable"));
    mockGetAllSnapshots.mockRejectedValueOnce(new Error("No snapshot store"));
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.status).toBe("degraded");
    expect(json.redis).toBe("down");
    expect(json.sources).toEqual({});
    expect(JSON.stringify(json)).not.toContain("No snapshot store");
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });

  it.each([
    ["open", false],
    ["half-open", false],
    ["half-open", true],
  ] as const)("skips PING while circuit is %s (probe active: %s)", async (circuit, probing) => {
    redisState.circuit = circuit;
    redisState.probing = probing;

    for (let i = 0; i < 10; i++) {
      const res = await GET();
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ status: "degraded", redis: "down" });
    }

    expect(mockRedisPing).not.toHaveBeenCalled();
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
    expect(mockGetAllSnapshots.mock.calls).toEqual(Array.from({ length: 10 }, () => []));
  });

  it("reports quota failure and skips commands on subsequent health requests", async () => {
    mockRedisPing.mockImplementationOnce(async () => {
      redisState.circuit = "open";
      throw new Error("ERR max requests limit exceeded");
    });

    for (let i = 0; i < 10; i++) {
      const res = await GET();
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ status: "degraded", redis: "down" });
    }

    expect(mockRedisPing).toHaveBeenCalledOnce();
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });

  it("reports readiness unavailable when Redis is unconfigured", async () => {
    redisState.configured = false;
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ status: "degraded", redis: "unconfigured" });
    expect(mockRedisPing).not.toHaveBeenCalled();
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });

  it("serves process liveness independently of all dependencies", async () => {
    redisState.configured = false;
    redisState.circuit = "open";
    const { GET: live } = await import("../live/route");
    const res = live();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(mockEnsureRedisReady).not.toHaveBeenCalled();
    expect(mockRedisPing).not.toHaveBeenCalled();
    expect(mockGetAllSnapshots).not.toHaveBeenCalled();
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });
});
