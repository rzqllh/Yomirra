import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisState = vi.hoisted(() => ({ allowed: true }));
vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  isRedisCommandAllowed: () => redisState.allowed,
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}));
import { domainResolver } from "../domain-resolver";
import { redis } from "@/server/lib/cache/redis";

describe("Domain resolver short-lived Redis read deduplication", () => {
  beforeEach(async () => {
    vi.useRealTimers();
    redisState.allowed = true;
    vi.mocked(redis.get).mockReset();
    vi.mocked(redis.setex).mockReset();
    vi.mocked(redis.del).mockReset();
    vi.mocked(redis.del).mockResolvedValue(1);
    await domainResolver.resetDomainCache();
  });
  afterEach(() => vi.useRealTimers());

  it("caches a missing default-domain key for ten seconds", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    expect(await domainResolver.resolveDomain("komikindo")).toBe("https://komikindo.ch");
    expect(await domainResolver.resolveDomain("komikindo")).toBe("https://komikindo.ch");
    expect(redis.get).toHaveBeenCalledOnce();
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_001);
    await domainResolver.resolveDomain("komikindo");
    expect(redis.get).toHaveBeenCalledTimes(2);
  });

  it("immediately sees a domain written by the current isolate", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    await domainResolver.resolveDomain("komikindo");
    await domainResolver.recordWorkingDomain("komikindo", "https://komikindo.cv");
    expect(await domainResolver.resolveDomain("komikindo")).toBe("https://komikindo.cv");
    expect(redis.get).toHaveBeenCalledOnce();
    expect(redis.setex).toHaveBeenCalledOnce();
  });

  it("does not touch Redis when the quota circuit is open", async () => {
    redisState.allowed = false;
    await domainResolver.recordWorkingDomain("komikindo", "https://komikindo.cv");
    expect(await domainResolver.resolveDomain("komikindo")).toBe("https://komikindo.cv");
    expect(redis.get).not.toHaveBeenCalled();
  });

  it("clears near-cache when an administrator resets a domain", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    await domainResolver.resolveDomain("komikindo");
    await domainResolver.resetDomainCache("komikindo");
    await domainResolver.resolveDomain("komikindo");
    expect(redis.get).toHaveBeenCalledTimes(2);
  });
});
