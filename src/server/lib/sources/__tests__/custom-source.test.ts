import { describe, expect, it, vi, beforeEach } from "vitest";

let mockMultiExecResults: any[] = [[null, "OK"], [null, 1]];

const mockMulti = {
  set: vi.fn().mockReturnThis(),
  sadd: vi.fn().mockReturnThis(),
  del: vi.fn().mockReturnThis(),
  srem: vi.fn().mockReturnThis(),
  exec: vi.fn().mockImplementation(async () => mockMultiExecResults),
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
    expect(mockMulti.set).toHaveBeenCalled();
    expect(mockMulti.sadd).toHaveBeenCalledWith("yomirra:sources:custom:index", "komikcast");
    expect(mockMulti.exec).toHaveBeenCalled();

    const meta = customSourceToMetadata(source);
    expect(meta.id).toBe("komikcast");
    expect(meta.isDynamic).toBe(true);
    expect(meta.capabilities.popular).toBe(true);
  });

  it("should delete custom source and flush associated cache", async () => {
    mockMultiExecResults = [[null, 1], [null, 1]];
    mockRedis.del.mockResolvedValue(1);
    mockRedis.scan.mockResolvedValueOnce(["0", ["yomirra:cache:komikcast:ch1"]]);

    const { deleteCustomSource } = await import("../custom-source-service");
    const result = await deleteCustomSource("komikcast");

    expect(result).toBe(true);
    expect(mockMulti.del).toHaveBeenCalledWith("yomirra:sources:custom:komikcast");
    expect(mockMulti.srem).toHaveBeenCalledWith("yomirra:sources:custom:index", "komikcast");
  });
});
