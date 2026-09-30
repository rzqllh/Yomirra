import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock redis
const mockInfo = vi.fn();
const mockKeys = vi.fn();
const mockTtl = vi.fn();
const mockType = vi.fn();
const mockGet = vi.fn();
const mockDel = vi.fn();

vi.mock("@/server/lib/cache/redis", () => ({
  redis: {
    info: (...args: any[]) => mockInfo(...args),
    keys: (...args: any[]) => mockKeys(...args),
    ttl: (...args: any[]) => mockTtl(...args),
    type: (...args: any[]) => mockType(...args),
    get: (...args: any[]) => mockGet(...args),
    del: (...args: any[]) => mockDel(...args),
  },
}));

describe("Admin Redis Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return telemetry info with memory and keyspace", async () => {
    mockInfo.mockResolvedValueOnce("used_memory_human:14.2M\nuptime_in_days:12\nconnected_clients:4");
    mockKeys.mockResolvedValueOnce(["k1", "k2"]);

    const { getRedisTelemetry } = await import("../admin-redis-service");
    const telem = await getRedisTelemetry();

    expect(telem.usedMemory).toBe("14.2M");
    expect(telem.uptimeDays).toBe(12);
    expect(telem.totalSampledKeys).toBe(2);
  });

  it("should scan keys and return metadata with TTL and type", async () => {
    mockKeys.mockResolvedValueOnce(["yomirra:site:config"]);
    mockTtl.mockResolvedValueOnce(-1);
    mockType.mockResolvedValueOnce("string");

    const { scanRedisKeys } = await import("../admin-redis-service");
    const result = await scanRedisKeys("yomirra:*");

    expect(result.length).toBe(1);
    expect(result[0].key).toBe("yomirra:site:config");
    expect(result[0].type).toBe("string");
    expect(result[0].ttl).toBe(-1);
  });

  it("should delete key successfully", async () => {
    mockDel.mockResolvedValueOnce(1);
    const { deleteRedisKey } = await import("../admin-redis-service");
    const result = await deleteRedisKey("yomirra:temp:key");
    expect(result).toBe(true);
    expect(mockDel).toHaveBeenCalledWith("yomirra:temp:key");
  });
});
