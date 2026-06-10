import { describe, it, expect, vi } from "vitest";
import { swrCache } from "../strategies";

// Mock redis client
vi.mock("../redis", () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe("Cache: swrCache", () => {
  it("should return cached data if available", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({ mock: "data" }));

    const fetcher = vi.fn().mockResolvedValue({ new: "data" });
    const result = await swrCache("test-key", fetcher, 60);

    expect(result).toEqual({ mock: "data" });
    // Should still call fetcher for SWR update in background (if SWR actually does background)
    // Actually in our implementation, it awaits `fetcher` ONLY IF cache is missed. Wait!
    // Our implementation: 
    // const cached = await redis.get(key);
    // if (cached) return JSON.parse(cached);
    // const data = await fetcher(); ... return data;
    // So it's technically 'Cache Aside', not true SWR (Stale While Revalidate).
    
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("should fetch and cache if not in redis", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.setex).mockResolvedValueOnce("OK");

    const fetcher = vi.fn().mockResolvedValue({ new: "data" });
    const result = await swrCache("test-key", fetcher, 60);

    expect(result).toEqual({ new: "data" });
    expect(fetcher).toHaveBeenCalled();
    expect(redis.setex).toHaveBeenCalledWith("test-key", 60, JSON.stringify({ new: "data" }));
  });
});
