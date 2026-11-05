import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { withCache, _resetNearCacheForTesting } from '../redis-cache';

const redisState = vi.hoisted(() => ({
  configured: true,
  circuit: "closed" as "closed" | "open" | "half-open",
  probing: false,
}));

// Mock redis client
vi.mock("../redis", () => ({
  get isRedisConfigured() { return redisState.configured; },
  isRedisCircuitOpen: () => redisState.circuit !== "closed",
  isRedisCommandAllowed: () => redisState.circuit === "closed",
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe("Cache: withCache", () => {
  afterEach(() => { vi.useRealTimers(); });
  beforeEach(async () => {
    _resetNearCacheForTesting();
    redisState.configured = true;
    redisState.circuit = "closed";
    redisState.probing = false;
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

  it("rejects stale data beyond one hour even when active TTL is a full day", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({
      data: "too old", expiresAt: Date.now() - 2 * 60 * 60 * 1000,
    }));
    await expect(withCache("expired-grace", async () => { throw new Error("provider unavailable"); }, 86400))
      .rejects.toThrow("provider unavailable");
  });

  it("does not retain or serve stale pages when explicitly disabled", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.setex).mockResolvedValueOnce("OK");

    await withCache("signed-url", async () => ({ url: "https://example.com/new" }), 300, { allowStaleOnError: false });
    expect(redis.setex).toHaveBeenCalledWith("signed-url", 300, expect.any(String));

    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_001);
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

  it.each([
    ["open", false],
    ["half-open", false],
    ["half-open", true],
  ] as const)("skips GET/SETEX while circuit is %s (probe active: %s)", async (circuit, probing) => {
    const { redis } = await import("../redis");
    redisState.circuit = circuit;
    redisState.probing = probing;
    const fetcher = vi.fn().mockResolvedValue({ fallback: true });

    await expect(withCache("blocked", fetcher, 60)).resolves.toEqual({ fallback: true });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.setex).not.toHaveBeenCalled();
  });

  it("bypasses Redis when it is not configured", async () => {
    const { redis } = await import("../redis");
    redisState.configured = false;
    await expect(withCache("unconfigured", async () => "fresh", 60)).resolves.toBe("fresh");
    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.setex).not.toHaveBeenCalled();
  });

  it("serves fresh results after a quota GET failure without attempting SETEX", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockImplementationOnce(async () => {
      redisState.circuit = "open";
      throw new Error("ERR max requests limit exceeded");
    });
    const fetcher = vi.fn().mockResolvedValue("fresh");

    await expect(withCache("quota-get", fetcher, 60)).resolves.toBe("fresh");
    await expect(withCache("quota-get-again", fetcher, 60)).resolves.toBe("fresh");
    expect(redis.get).toHaveBeenCalledOnce();
    expect(redis.setex).not.toHaveBeenCalled();
  });

  it("preserves fetched data when GET, parsing, or SETEX fails", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get)
      .mockRejectedValueOnce(new Error("connection closed"))
      .mockResolvedValueOnce("{malformed");
    vi.mocked(redis.setex).mockRejectedValue(new Error("ERR max requests limit exceeded"));

    for (const key of ["read-failure", "parse-failure"]) {
      await expect(withCache(key, async () => ({ fresh: true }), 60)).resolves.toEqual({ fresh: true });
    }
    expect(redis.setex).toHaveBeenCalledTimes(2);
  });

  it("caps physical retention at active TTL plus one hour", async () => {
    const { redis } = await import("../redis");
    await withCache("long-lived", async () => "fresh", 86400);
    expect(redis.setex).toHaveBeenCalledWith("long-lived", 90000, expect.any(String));
  });

  it.each([true, false])("shares concurrent fetches and clears completed work (Redis configured: %s)", async (configured) => {
    const { redis } = await import("../redis");
    redisState.configured = configured;
    let resolve!: (value: string) => void;
    const fetcher = vi.fn(() => new Promise<string>((done) => { resolve = done; }));
    const requests = Array.from({ length: 20 }, () => withCache("shared", fetcher, 60));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    resolve("fresh");
    await expect(Promise.all(requests)).resolves.toEqual(Array(20).fill("fresh"));
    expect(redis.setex).toHaveBeenCalledTimes(configured ? 1 : 0);

    // Completed in-flight work is gone, but its fresh bounded near-cache survives.
    await expect(withCache("shared", async () => "unexpected", 60)).resolves.toBe("fresh");
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_001);
    await expect(withCache("shared", async () => "next", 60)).resolves.toBe("next");
  });

  it("clears failed in-flight work so a later fetch can recover", async () => {
    let reject!: (error: Error) => void;
    const fetcher = vi.fn(() => new Promise<string>((_, fail) => { reject = fail; }));
    const requests = [withCache("retry", fetcher, 60), withCache("retry", fetcher, 60)];
    const results = Promise.allSettled(requests);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    reject(new Error("provider unavailable"));
    expect(await results).toEqual([
      { status: "rejected", reason: expect.any(Error) },
      { status: "rejected", reason: expect.any(Error) },
    ]);
    await expect(withCache("retry", async () => "recovered", 60)).resolves.toBe("recovered");
  });

  it("bounds a never-settling flight and permits replacement after expiration", async () => {
    vi.useFakeTimers();
    redisState.configured = false;
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    const results = Promise.allSettled([
      withCache("never-settles", fetcher, 60), withCache("never-settles", fetcher, 60),
    ]);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(fetcher).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    expect(await results).toEqual(Array(2).fill({
      status: "rejected", reason: expect.objectContaining({ message: "Cache request timed out after 30000ms" }),
    }));
    await expect(withCache("never-settles", async () => "replacement", 60)).resolves.toBe("replacement");
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["resolve", "reject"] as const)("fences late original %s from a pending replacement", async (settle) => {
    vi.useFakeTimers();
    const { redis } = await import("../redis");
    let resolveOriginal!: (value: string) => void;
    let rejectOriginal!: (error: Error) => void;
    const original = withCache("late-original", () => new Promise<string>((resolve, reject) => {
      resolveOriginal = resolve;
      rejectOriginal = reject;
    }), 60);
    const expired = expect(original).rejects.toThrow("Cache request timed out after 30000ms");
    await vi.advanceTimersByTimeAsync(30_000);
    await expired;
    let resolveReplacement!: (value: string) => void;
    const replacementFetcher = vi.fn(() => new Promise<string>((resolve) => { resolveReplacement = resolve; }));
    const replacement = withCache("late-original", replacementFetcher, 60);
    await vi.advanceTimersByTimeAsync(0);
    if (settle === "resolve") resolveOriginal("obsolete");
    else rejectOriginal(new Error("late rejection"));
    await vi.advanceTimersByTimeAsync(0);
    expect(redis.setex).not.toHaveBeenCalled();
    const duplicateFetcher = vi.fn(async () => "unexpected duplicate");
    const joined = withCache("late-original", duplicateFetcher, 60);
    resolveReplacement("fresh replacement");
    await expect(Promise.all([replacement, joined])).resolves.toEqual(["fresh replacement", "fresh replacement"]);
    expect(replacementFetcher).toHaveBeenCalledOnce();
    expect(duplicateFetcher).not.toHaveBeenCalled();
    expect(redis.setex).toHaveBeenCalledOnce();
    expect(redis.setex).toHaveBeenCalledWith("late-original", 120, expect.stringContaining("fresh replacement"));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("caps distinct in-flight keys and frees capacity on timeout", async () => {
    vi.useFakeTimers();
    redisState.configured = false;
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    const results = Promise.allSettled(Array.from({ length: 1024 }, (_, index) =>
      withCache(`capacity-${index}`, fetcher, 60),
    ));
    const rejectedFetcher = vi.fn(async () => "must not start");
    await expect(withCache("capacity-overflow", rejectedFetcher, 60)).rejects.toThrow("Cache in-flight capacity exceeded");
    expect(rejectedFetcher).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1024);
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await results).every((result) => result.status === "rejected")).toBe(true);
    await expect(withCache("capacity-overflow", async () => "available", 60)).resolves.toBe("available");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("isolates concurrent requests with different TTLs and stale options", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({ data: "stale", expiresAt: Date.now() - 1000 }));
    let reject!: (error: Error) => void;
    const fetcher = vi.fn(() => new Promise<string>((_, fail) => { reject = fail; }));
    const stale = withCache("same-key", fetcher, 60);
    const strict = withCache("same-key", async () => { throw new Error("strict failure"); }, 60, { allowStaleOnError: false });
    const differentTtl = withCache("same-key", async () => "longer", 3600);
    const results = Promise.allSettled([stale, strict, differentTtl]);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    reject(new Error("stale fallback"));
    expect(await results).toEqual([
      { status: "fulfilled", value: "stale" },
      { status: "rejected", reason: expect.objectContaining({ message: "strict failure" }) },
      { status: "fulfilled", value: "longer" },
    ]);
    expect(redis.setex).toHaveBeenCalledOnce();
    expect(redis.setex).toHaveBeenCalledWith("same-key", 7200, expect.stringContaining('"longer"'));
  });

  it("deduplicates hot Redis GETs, without sharing mutable result references", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({
      data: { total: 1 }, expiresAt: Date.now() + 60_000,
    }));
    const first = await withCache("hot-key", async () => ({ total: 5 }), 60);
    first.total = 99;
    const second = await withCache("hot-key", async () => ({ total: 5 }), 60);
    expect(second).toEqual({ total: 1 });
    expect(redis.get).toHaveBeenCalledOnce();
  });

  it("does not cache oversized results or retain them beyond the near TTL", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({
      data: { payload: "x".repeat(70_000) }, expiresAt: Date.now() + 60_000,
    }));
    await withCache("large-key", async () => "unused", 60);
    await withCache("large-key", async () => "unused", 60);
    expect(redis.get).toHaveBeenCalledTimes(2);

    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({
      data: { payload: "small" }, expiresAt: Date.now() + 60_000,
    }));
    await withCache("expiring-hot-key", async () => "unused", 60);
    await withCache("expiring-hot-key", async () => "unused", 60);
    expect(redis.get).toHaveBeenCalledTimes(3);
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_001);
    await withCache("expiring-hot-key", async () => "unused", 60);
    expect(redis.get).toHaveBeenCalledTimes(4);
  });

  it("never shares near-cache values between different TTL or stale contracts", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({
      data: "cached", expiresAt: Date.now() + 60_000,
    }));
    await withCache("partition-key", async () => "new", 60);
    await withCache("partition-key", async () => "new", 3600);
    await withCache("partition-key", async () => "new", 60, { allowStaleOnError: false });
    expect(redis.get).toHaveBeenCalledTimes(3);
  });

  it("evicts old entries instead of growing without bound", async () => {
    const { redis } = await import("../redis");
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify({
      data: "hit", expiresAt: Date.now() + 60_000,
    }));
    for (let index = 0; index < 257; index++) {
      await withCache(`bounded-${index}`, async () => "miss", 60);
    }
    await withCache("bounded-0", async () => "miss", 60);
    expect(redis.get).toHaveBeenCalledTimes(258);
  });


  it("never warms near-cache from a Redis GET that returns after the flight deadline", async () => {
    vi.useFakeTimers();
    const { redis } = await import("../redis");
    let resolveOld!: (value: string) => void;
    vi.mocked(redis.get).mockImplementationOnce(
      () => new Promise<string>((resolve) => { resolveOld = resolve; }),
    );

    const old = withCache("late-read", async () => "unexpected", 60);
    const expired = expect(old).rejects.toThrow("Cache request timed out after 30000ms");
    await vi.advanceTimersByTimeAsync(30_000);
    await expired;

    resolveOld(JSON.stringify({ data: "obsolete", expiresAt: Date.now() + 60_000 }));
    await vi.advanceTimersByTimeAsync(0);

    vi.mocked(redis.get).mockResolvedValueOnce(null);
    await expect(withCache("late-read", async () => "fresh", 60)).resolves.toBe("fresh");
    expect(redis.get).toHaveBeenCalledTimes(2);
  });

});
