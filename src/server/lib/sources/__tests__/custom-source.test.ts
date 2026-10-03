import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRedis = {
  smembers: vi.fn(),
  mget: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  sadd: vi.fn(),
  del: vi.fn(),
  srem: vi.fn(),
  keys: vi.fn(),
};

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  redis: mockRedis,
}));

describe("Custom Dynamic Source Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save and retrieve custom dynamic source", async () => {
    mockRedis.set.mockResolvedValueOnce("OK");
    mockRedis.sadd.mockResolvedValueOnce(1);

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
    expect(mockRedis.set).toHaveBeenCalled();
    expect(mockRedis.sadd).toHaveBeenCalledWith("yomirra:sources:custom:index", "komikcast");

    const meta = customSourceToMetadata(source);
    expect(meta.id).toBe("komikcast");
    expect(meta.isDynamic).toBe(true);
    expect(meta.capabilities.popular).toBe(true);
  });

  it("should delete custom source and flush associated cache", async () => {
    mockRedis.del.mockResolvedValue(1);
    mockRedis.srem.mockResolvedValueOnce(1);
    mockRedis.keys.mockResolvedValueOnce(["yomirra:cache:komikcast:ch1"]);

    const { deleteCustomSource } = await import("../custom-source-service");
    const result = await deleteCustomSource("komikcast");

    expect(result).toBe(true);
    expect(mockRedis.del).toHaveBeenCalledWith("yomirra:sources:custom:komikcast");
    expect(mockRedis.srem).toHaveBeenCalledWith("yomirra:sources:custom:index", "komikcast");
  });
});
