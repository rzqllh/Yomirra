import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  set: vi.fn(),
  eval: vi.fn(),
};

const mockProbeAllSourcesHealth = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  isRedisCircuitOpen: () => false,
  isRedisCommandAllowed: () => true,
  isRedisReady: () => true,
  get redis() {
    return mockRedis;
  },
}));

vi.mock("@/shared/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/server/lib/sources/health/probe", () => ({
  probeAllSourcesHealth: (...args: unknown[]) => mockProbeAllSourcesHealth(...args),
}));

import { GET } from "../route";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { sourceRegistry } from "@/shared/sources/source-registry";

describe("GET /api/sources/health", () => {
  let clock = Date.now();

  afterEach(() => { vi.useRealTimers(); });
  beforeEach(async () => {
    vi.restoreAllMocks();
    clock += 60_000;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(clock);
    mockRedis.get.mockReset();
    mockRedis.setex.mockReset();
    mockRedis.set.mockReset();
    mockRedis.eval.mockReset();
    mockProbeAllSourcesHealth.mockReset();
    await sourceHealthStore.clear();
  });

  it("serves cached payload immediately on Redis cache hit (<50ms)", async () => {
    const cachedPayload = {
      data: {
        mangadex: {
          id: "mangadex",
          status: "online",
          latency: "120ms",
          uptime: "99.0%",
          message: "Server merespons dengan baik.",
          checkedAt: "2026-11-03T00:00:00.000Z",
        },
      },
      meta: {
        cached: false,
        stale: false,
        checkedAt: "2026-11-03T00:00:00.000Z",
        probeType: "functional",
      },
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(cachedPayload));

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.meta.cached).toBe(true);
    expect(json.meta.stale).toBe(false);
    expect(json.data.mangadex.status).toBe("online");
    expect(mockProbeAllSourcesHealth).not.toHaveBeenCalled();
  });

  it("serves non-blocking snapshot response on cache miss and triggers background probe", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.setex.mockResolvedValue("OK");
    mockRedis.eval.mockResolvedValue(1);

    // Pre-populate store with a known snapshot
    await sourceHealthStore.recordSnapshot({
      sourceId: "shinigami",
      status: "HEALTHY",
      latencyMs: 110,
      resolvedHost: "https://api.shngm.io",
      lastCheckedAt: "2026-11-03T01:00:00.000Z",
      lastSuccessAt: "2026-11-03T01:00:00.000Z",
      lastFailureAt: null,
      consecutiveFailures: 0,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.meta.cached).toBe(false);
    expect(json.meta.stale).toBe(true);
    // Verified snapshot returned immediately
    expect(json.data.shinigami).toMatchObject({
      status: "online",
      id: "shinigami",
    });
    // Sources without snapshot return honest unknown status
    expect(json.data.komikindo).toMatchObject({
      status: "unknown",
      message: "Sumber belum diperiksa.",
      uptime: "-",
      latency: "-",
    });
  });

  it("sanitizes broken source failure messages into safe user-facing text", async () => {
    mockRedis.get.mockResolvedValue(null);

    await sourceHealthStore.recordSnapshot({
      sourceId: "komikindo",
      status: "BROKEN",
      stage: "search",
      latencyMs: 250,
      resolvedHost: "https://komikindo.example",
      lastCheckedAt: "2026-11-03T01:00:00.000Z",
      lastSuccessAt: null,
      lastFailureAt: "2026-11-03T01:00:00.000Z",
      consecutiveFailures: 1,
      lastFailureCode: "UPSTREAM_BLOCKED",
      errorMessage: "HTTP Error 403 with internal upstream details that must never leak",
    });

    const res = await GET();
    const json = await res.json();

    expect(json.data.komikindo.status).toBe("unavailable");
    expect(json.data.komikindo.message).toBe("akses ke sumber ditolak");
    expect(JSON.stringify(json)).not.toContain("internal upstream details");
  });

  it("coalesces a cold burst and reuses the result within the local TTL", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue(null);
    const responses = await Promise.all(Array.from({ length: 12 }, () => GET()));
    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(mockRedis.get.mock.calls.filter(([key]) => key === "yomirra:sources:health:v7")).toHaveLength(1);
    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    await GET();
    expect(mockRedis.get.mock.calls.filter(([key]) => key === "yomirra:sources:health:v7")).toHaveLength(1);
  });

  it("includes healthCheckUrl for MangaDex in registry", () => {
    const md = sourceRegistry.find((s) => s.id === "mangadex");
    expect(md?.healthCheckUrl).toBe("https://api.mangadex.org/manga?limit=1");
  });

  it("survives Redis stream errors gracefully without failing", async () => {
    mockRedis.get.mockRejectedValue(new Error("Stream isn't writeable and enableOfflineQueue options is false"));
    mockRedis.set.mockRejectedValue(new Error("Stream isn't writeable"));

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });
});
