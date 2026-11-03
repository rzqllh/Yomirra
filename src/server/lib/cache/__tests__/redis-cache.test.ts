import { beforeEach, describe, it, expect, vi } from "vitest";
import { withCache, CACHE_TTL } from '../redis-cache';

// Mock redis client
vi.mock("../redis", () => ({
  isRedisConfigured: true,
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe("Cache: withCache", () => {
  beforeEach(async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockReset();
    vi.mocked(redis.setex).mockReset();
  });

  it("should return cached data if available", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({ mock: "data" }));

    const fetcher = vi.fn().mockResolvedValue({ new: "data" });
    const result = await withCache("test-key", fetcher, 60);

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

  it("allows stale fallback only within a one-hour maximum grace window", async () => {
    const { redis } = await import("../redis");
    const now = Date.now();
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({
      data: { old: "allowed" },
      expiresAt: now - 30 * 60 * 1000,
    }));
    const fetcher = vi.fn().mockRejectedValue(new Error("upstream timeout"));

    await expect(withCache("stale-allowed", fetcher, 3600)).resolves.toEqual({ old: "allowed" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects week-old data even if a legacy Redis key still exists", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({
      data: { old: "unsafe" },
      expiresAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    }));
    const fetcher = vi.fn().mockRejectedValue(new Error("provider unavailable"));

    await expect(withCache("week-old", fetcher, 60)).rejects.toThrow("provider unavailable");
  });

  it("does not retain or serve stale pages when explicitly disabled", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.setex).mockResolvedValueOnce("OK");

    await withCache("signed-url", async () => ({ url: "https://example.com/new" }), 300, { allowStaleOnError: false });
    expect(redis.setex).toHaveBeenCalledWith("signed-url", 300, expect.any(String));

    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({
      data: { url: "https://example.com/expired" },
      expiresAt: Date.now() - 1,
    }));
    await expect(withCache("signed-url", async () => { throw new Error("expired URL"); }, 300, { allowStaleOnError: false })).rejects.toThrow("expired URL");
  });

  it("should fetch and cache if not in redis", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.setex).mockResolvedValueOnce("OK");

    const fetcher = vi.fn().mockResolvedValue({ new: "data" });
    const result = await withCache("test-key", fetcher, 60);

    expect(result).toEqual({ new: "data" });
    expect(fetcher).toHaveBeenCalled();
    expect(redis.setex).toHaveBeenCalledWith("test-key", 120, expect.stringContaining('"new":"data"'));
  });
});
