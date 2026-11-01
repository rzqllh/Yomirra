import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedisPing = vi.fn();
const mockGetAllSnapshots = vi.fn();
const mockProbeAllSourcesHealth = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  redis: { ping: (...args: unknown[]) => mockRedisPing(...args) },
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

import { GET } from "../route";

describe("GET /api/health liveness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisPing.mockResolvedValue("PONG");
    mockGetAllSnapshots.mockResolvedValue({});
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

  it("does not probe providers even if liveness is polled repeatedly", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await GET();
      expect(res.status).toBe(200);
    }
    expect(mockGetAllSnapshots).toHaveBeenCalledTimes(10);
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
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
});
