import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock redis
const mockKeys = vi.fn();
const mockDel = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  redis: {
    keys: (...args: any[]) => mockKeys(...args),
    del: (...args: any[]) => mockDel(...args),
    get: (...args: any[]) => mockGet(...args),
    set: (...args: any[]) => mockSet(...args),
  },
}));

vi.mock("@/server/lib/sources/health/health-store", () => ({
  sourceHealthStore: {
    getHealth: vi.fn((sourceId) => {
      if (sourceId === "shinigami") {
        return { status: "HEALTHY", consecutiveFailures: 0, lastFailureReason: null };
      }
      return { status: "DEGRADED", consecutiveFailures: 2, lastFailureReason: "Timeout" };
    }),
  },
}));

vi.mock("@/server/lib/sources/domain-resolver", () => ({
  domainResolver: {
    resolve: vi.fn((sourceId) => `https://${sourceId}.domain.test`),
    setOverride: vi.fn(),
  },
}));

describe("Admin Source Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return complete source health matrix for registered sources", async () => {
    const { getSourceHealthMatrix } = await import("../admin-source-service");
    const matrix = await getSourceHealthMatrix();

    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThan(0);

    const shinigami = matrix.find((s) => s.id === "shinigami");
    expect(shinigami).toBeDefined();
    expect(shinigami?.name).toBe("Shinigami");
    expect(shinigami?.healthStatus).toBe("HEALTHY");
    expect(shinigami?.consecutiveFailures).toBe(0);
  });

  it("should flush specific source cache keys in Redis", async () => {
    mockKeys.mockResolvedValueOnce(["source:shinigami:popular:1", "source:shinigami:latest:1"]);
    mockDel.mockResolvedValueOnce(2);

    const { flushSourceCache } = await import("../admin-source-service");
    const result = await flushSourceCache("shinigami");

    expect(mockKeys).toHaveBeenCalledWith("source:shinigami:*");
    expect(mockDel).toHaveBeenCalledWith("source:shinigami:popular:1", "source:shinigami:latest:1");
    expect(result.deletedCount).toBe(2);
  });

  it("should flush all source cache keys if no sourceId provided", async () => {
    mockKeys.mockResolvedValueOnce(["source:shinigami:1", "source:komikindo:1"]);
    mockDel.mockResolvedValueOnce(2);

    const { flushSourceCache } = await import("../admin-source-service");
    const result = await flushSourceCache();

    expect(mockKeys).toHaveBeenCalledWith("source:*");
    expect(result.deletedCount).toBe(2);
  });

  it("should save and apply dynamic core source override", async () => {
    mockGet.mockResolvedValueOnce(null);
    mockSet.mockResolvedValue("OK");

    const { saveCoreSourceOverride } = await import("../admin-source-service");
    const saved = await saveCoreSourceOverride("shinigami", {
      activeDomain: "https://shinigami-new.id",
      isEnabled: false,
    });

    expect(saved.id).toBe("shinigami");
    expect(saved.activeDomain).toBe("https://shinigami-new.id");
    expect(saved.isEnabled).toBe(false);
    expect(mockSet).toHaveBeenCalled();
  });
});
