import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedisPing = vi.fn();
const mockProbeAllSourcesHealth = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  redis: { ping: (...args: unknown[]) => mockRedisPing(...args) },
}));

vi.mock("@/server/lib/sources/health/probe", () => ({
  probeAllSourcesHealth: (...args: unknown[]) => mockProbeAllSourcesHealth(...args),
}));

vi.mock("@/shared/sources/source-registry", () => ({
  getAllSourceMetadata: () => [
    { id: "legacy-source", isEnabled: true, isInstalled: true },
  ],
}));

vi.mock("@/server/lib/sources/source-manager", () => ({
  sourceManager: {
    getSource: vi.fn().mockResolvedValue({
      getPopular: vi.fn().mockResolvedValue({ mangas: [{ id: "legacy" }] }),
    }),
  },
}));

vi.mock("@/shared/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { GET } from "../route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisPing.mockResolvedValue("PONG");
  });

  it("reports the shared functional probe result without raw failure messages", async () => {
    mockProbeAllSourcesHealth.mockResolvedValue({
      shinigami: {
        sourceId: "shinigami",
        status: "HEALTHY",
        latencyMs: 90,
        resolvedHost: "https://api.shngm.io",
        lastCheckedAt: "2026-10-05T05:00:00.000Z",
        lastSuccessAt: "2026-10-05T05:00:00.000Z",
        lastFailureAt: null,
        consecutiveFailures: 0,
      },
      doujindesu: {
        sourceId: "doujindesu",
        status: "BROKEN",
        stage: "transport",
        latencyMs: 5,
        resolvedHost: "https://restricted.example",
        lastCheckedAt: "2026-10-05T05:00:00.000Z",
        lastSuccessAt: null,
        lastFailureAt: "2026-10-05T05:00:00.000Z",
        consecutiveFailures: 1,
        lastFailureCode: "SOURCE_DOWN",
        errorMessage: "Restricted source credential is not configured",
      },
    });

    const res = await GET();
    const json = await res.json();

    expect(mockProbeAllSourcesHealth).toHaveBeenCalledWith({ deep: false });
    expect(res.status).toBe(503);
    expect(json.sources.shinigami).toEqual({ status: "ok", latencyMs: 90 });
    expect(json.sources.doujindesu).toEqual({
      status: "down",
      errorCode: "SOURCE_DOWN",
      error: "server sumber sedang tidak dapat dihubungi",
    });
    expect(JSON.stringify(json)).not.toContain("credential is not configured");
  });
});
