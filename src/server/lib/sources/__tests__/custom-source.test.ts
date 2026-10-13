import { describe, expect, it, vi, beforeEach } from "vitest";

const mockMulti = {
  set: vi.fn().mockReturnThis(),
  sadd: vi.fn().mockReturnThis(),
  del: vi.fn().mockReturnThis(),
  srem: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([[null, "OK"], [null, 1]]),
};

const mockRedis = {
  smembers: vi.fn(),
  mget: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  sadd: vi.fn(),
  del: vi.fn(),
  srem: vi.fn(),
  scan: vi.fn(),
  multi: vi.fn().mockReturnValue(mockMulti),
  eval: vi.fn().mockResolvedValue("OK"),
};

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  isRedisReady: vi.fn().mockReturnValue(true),
  ensureRedisReady: vi.fn().mockResolvedValue(undefined),
  redis: mockRedis,
}));

describe("Custom Dynamic Source Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save and retrieve custom dynamic source", async () => {
    mockRedis.eval.mockResolvedValueOnce("OK");

    const { saveCustomSource, customSourceToMetadata } = await import("../custom-source-service");

    const source = await saveCustomSource({
      id: "komikcast",
      name: "Komikcast",
      baseUrl: "https://komikcast.bz",
      mirrors: ["https://komikcast.site"],
      lang: "id",
      version: "1.0.0",
      type: "html",
      isNsfw: false,
      isEnabled: true,
      selectors: {
        popularPath: "/daftar-komik?order=popular",
        popularListSelector: ".list-update_item",
        titleSelector: "h3.title",
        coverSelector: "img",
        linkSelector: "a",
      },
    });

    expect(source.id).toBe("komikcast");
    expect(source.name).toBe("Komikcast");
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.stringContaining("SET"),
      2,
      "yomirra:sources:custom:komikcast",
      "yomirra:sources:custom:index",
      "komikcast",
      expect.any(String)
    );

    const meta = customSourceToMetadata(source);
    expect(meta.id).toBe("komikcast");
    expect(meta.isDynamic).toBe(true);
    expect(meta.capabilities.popular).toBe(true);
  });

  it("should delete custom source and flush associated cache", async () => {
    mockRedis.eval.mockResolvedValueOnce(1);
    mockRedis.del.mockResolvedValue(1);
    mockRedis.scan.mockResolvedValueOnce(["0", ["yomirra:cache:komikcast:ch1"]]);

    const { deleteCustomSource } = await import("../custom-source-service");
    const result = await deleteCustomSource("komikcast");

    expect(result).toBe(true);
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.stringContaining("DEL"),
      2,
      "yomirra:sources:custom:komikcast",
      "yomirra:sources:custom:index",
      "komikcast"
    );
    expect(mockRedis.del).toHaveBeenCalledWith("yomirra:cache:komikcast:ch1");
  });
});
