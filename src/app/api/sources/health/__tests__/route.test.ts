import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
};

const mockProbeAllSourcesHealth = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
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
import { sourceRegistry } from "@/shared/sources/source-registry";

describe("GET /api/sources/health", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRedis.get.mockReset();
    mockRedis.setex.mockReset();
    mockProbeAllSourcesHealth.mockReset();
  });

  it("uses functional probes as the source of truth and sanitizes failures", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue("OK");
    mockProbeAllSourcesHealth.mockResolvedValue({
      shinigami: {
        sourceId: "shinigami",
        status: "HEALTHY",
        latencyMs: 120,
        resolvedHost: "https://api.shngm.io",
        lastCheckedAt: "2026-10-05T05:00:00.000Z",
        lastSuccessAt: "2026-10-05T05:00:00.000Z",
        lastFailureAt: null,
        consecutiveFailures: 0,
      },
      komikindo: {
        sourceId: "komikindo",
        status: "BROKEN",
        stage: "search",
        latencyMs: 250,
        resolvedHost: "https://komikindo.example",
        lastCheckedAt: "2026-10-05T05:00:00.000Z",
        lastSuccessAt: null,
        lastFailureAt: "2026-10-05T05:00:00.000Z",
        consecutiveFailures: 1,
        lastFailureCode: "UPSTREAM_BLOCKED",
        errorMessage: "HTTP Error 403 with internal upstream details",
      },
    });

    const rawFetch = vi.spyOn(global, "fetch").mockRejectedValue(new Error("raw reachability ping should not run"));

    const res = await GET();
    const json = await res.json();

    expect(mockProbeAllSourcesHealth).toHaveBeenCalledWith({ deep: false });
    expect(rawFetch).not.toHaveBeenCalled();
    expect(json.data.shinigami).toMatchObject({ status: "online", latency: "120ms" });
    expect(json.data.komikindo).toMatchObject({
      status: "unavailable",
      message: "diblokir perlindungan situs (Cloudflare)",
    });
    expect(json.data.komikindo.message).not.toContain("internal upstream details");
    expect(json.meta).toMatchObject({ cached: false, probeType: "functional" });
  });

  it("includes healthCheckUrl for MangaDex in registry", () => {
    const md = sourceRegistry.find((s) => s.id === "mangadex");
    expect(md?.healthCheckUrl).toBe("https://api.mangadex.org/manga?limit=1");
  });

  it("returns health check data for registered sources", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue("OK");
    mockProbeAllSourcesHealth.mockResolvedValue(
      Object.fromEntries(
        ["mangadex", "shinigami", "komikindo"].map((sourceId) => [
          sourceId,
          {
            sourceId,
            status: "HEALTHY",
            latencyMs: 100,
            resolvedHost: `https://${sourceId}.example`,
            lastCheckedAt: "2026-10-05T05:00:00.000Z",
            lastSuccessAt: "2026-10-05T05:00:00.000Z",
            lastFailureAt: null,
            consecutiveFailures: 0,
          },
        ])
      )
    );

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.mangadex.status).toBe("online");
    expect(json.data.shinigami.status).toBe("online");
    expect(json.data.komikindo.status).toBe("online");
  });

  it("normalizes functional probe failures into safe public messages", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockProbeAllSourcesHealth.mockResolvedValue({
      mangadex: {
        sourceId: "mangadex",
        status: "BROKEN",
        latencyMs: 10,
        resolvedHost: "https://mangadex.org",
        lastCheckedAt: "2026-10-05T05:00:00.000Z",
        lastSuccessAt: null,
        lastFailureAt: "2026-10-05T05:00:00.000Z",
        consecutiveFailures: 1,
        lastFailureCode: "SOURCE_DOWN",
        errorMessage: "certificate details that must stay private",
      },
    });

    const res = await GET();
    const json = await res.json();

    expect(json.data.mangadex.status).toBe("unavailable");
    expect(json.data.mangadex.message).toBe("server sumber sedang tidak dapat dihubungi");
    expect(JSON.stringify(json)).not.toContain("certificate details");
  });

  it("survives Redis stream errors without failing the health check", async () => {
    mockRedis.get.mockRejectedValue(new Error("Stream isn't writeable and enableOfflineQueue options is false"));
    mockRedis.setex.mockRejectedValue(new Error("Stream isn't writeable and enableOfflineQueue options is false"));
    mockProbeAllSourcesHealth.mockResolvedValue({
      mangadex: {
        sourceId: "mangadex",
        status: "HEALTHY",
        latencyMs: 100,
        resolvedHost: "https://mangadex.org",
        lastCheckedAt: "2026-10-05T05:00:00.000Z",
        lastSuccessAt: "2026-10-05T05:00:00.000Z",
        lastFailureAt: null,
        consecutiveFailures: 0,
      },
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.mangadex.status).toBe("online");
  });
});
