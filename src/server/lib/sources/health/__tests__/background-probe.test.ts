import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceHealthSnapshot } from "../types";

const mocks = vi.hoisted(() => ({
  configured: true,
  circuit: "closed" as "closed" | "open" | "half-open",
  probing: false,
  lockToken: null as string | null,
  set: vi.fn(),
  setex: vi.fn(),
  eval: vi.fn(),
  probe: vi.fn(),
  stats: vi.fn(),
}));

vi.mock("@/server/lib/cache/redis", () => ({
  get isRedisConfigured() { return mocks.configured; },
  isRedisCircuitOpen: () => mocks.circuit !== "closed",
  isRedisCommandAllowed: () => mocks.circuit === "closed",
  redis: { set: mocks.set, setex: mocks.setex, eval: mocks.eval },
}));

vi.mock("../probe", () => ({ probeAllSourcesHealth: mocks.probe }));
vi.mock("../health-store", () => ({ sourceHealthStore: { getRollingStats: mocks.stats } }));
vi.mock("@/shared/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

describe("background source health probe locking", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mocks.configured = true;
    mocks.circuit = "closed";
    mocks.probing = false;
    mocks.lockToken = null;
    mocks.set.mockImplementation(async (_key, token) => {
      if (mocks.lockToken) return null;
      mocks.lockToken = token;
      return "OK";
    });
    mocks.setex.mockResolvedValue("OK");
    mocks.eval.mockImplementation(async (_script, _count, _key, token) => {
      if (mocks.lockToken !== token) return 0;
      mocks.lockToken = null;
      return 1;
    });
    mocks.probe.mockResolvedValue({});
    mocks.stats.mockResolvedValue(undefined);
  });

  it.each([
    ["open", false],
    ["half-open", false],
    ["half-open", true],
  ] as const)("skips all commands and upstream while circuit is %s (probe active: %s)", async (circuit, probing) => {
    mocks.circuit = circuit;
    mocks.probing = probing;
    const { triggerBackgroundProbe } = await import("../background-probe");

    const results = await Promise.all(Array.from({ length: 20 }, () => triggerBackgroundProbe()));

    expect(results).toEqual(Array(20).fill(false));
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.setex).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
    expect(mocks.probe).not.toHaveBeenCalled();
    expect(mocks.stats).not.toHaveBeenCalled();
  });

  it.each(["quota", "connection", "contended"])("skips upstream when the configured lock is unavailable: %s", async (failure) => {
    if (failure === "contended") {
      mocks.set.mockResolvedValue(null);
    } else {
      mocks.set.mockRejectedValue(new Error(failure === "quota" ? "ERR max requests limit exceeded" : "connection closed"));
    }
    const { triggerBackgroundProbe, getInMemoryCachedPayload } = await import("../background-probe");

    expect(await Promise.all(Array.from({ length: 20 }, () => triggerBackgroundProbe())))
      .toEqual(Array(20).fill(false));
    expect(mocks.probe).not.toHaveBeenCalled();
    expect(mocks.setex).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
    expect(getInMemoryCachedPayload()).toBeNull();
  });

  it("allows only one concurrent probe through the Redis mutex and releases its own token", async () => {
    let resolve!: (value: Record<string, SourceHealthSnapshot>) => void;
    mocks.probe.mockReturnValue(new Promise((done) => { resolve = done; }));
    const { triggerBackgroundProbe, getInMemoryCachedPayload } = await import("../background-probe");

    const results = await Promise.all(Array.from({ length: 20 }, () => triggerBackgroundProbe()));
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(mocks.probe).toHaveBeenCalledExactlyOnceWith({ deep: false });
    expect(mocks.set).toHaveBeenCalledWith(
      "yomirra:lock:sources:health:probe", expect.any(String), "EX", 120, "NX",
    );
    resolve({});
    await vi.waitFor(() => expect(mocks.eval).toHaveBeenCalledOnce());
    expect(mocks.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("get", KEYS[1]) == ARGV[1]'),
      1, "yomirra:lock:sources:health:probe", mocks.set.mock.calls[0][1],
    );
    expect(mocks.setex).toHaveBeenCalledExactlyOnceWith(
      "yomirra:sources:health:v7", 600, expect.any(String),
    );
    expect(getInMemoryCachedPayload()).toMatchObject({ data: {}, meta: { cached: true, stale: false } });
  });

  it("skips subsequent lock attempts and all upstream work after a quota failure", async () => {
    mocks.set.mockImplementationOnce(async () => {
      mocks.circuit = "open";
      throw new Error("ERR max requests limit exceeded");
    });
    const { triggerBackgroundProbe } = await import("../background-probe");

    expect(await Promise.all(Array.from({ length: 20 }, () => triggerBackgroundProbe())))
      .toEqual(Array(20).fill(false));
    expect(mocks.set).toHaveBeenCalledOnce();
    expect(mocks.probe).not.toHaveBeenCalled();
    expect(mocks.setex).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
  });

  it("uses a local mutex only when Redis is unconfigured and releases it after failure", async () => {
    mocks.configured = false;
    let reject!: (error: Error) => void;
    mocks.probe.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const { triggerBackgroundProbe } = await import("../background-probe");

    expect(await Promise.all(Array.from({ length: 20 }, () => triggerBackgroundProbe())))
      .toEqual([true, ...Array(19).fill(false)]);
    reject(new Error("provider unavailable"));
    await vi.waitFor(async () => expect(await triggerBackgroundProbe()).toBe(true));
    expect(mocks.probe).toHaveBeenCalledTimes(2);
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.setex).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
  });

  it("releases the Redis mutex when upstream fails", async () => {
    mocks.probe.mockRejectedValueOnce(new Error("provider unavailable"));
    const { triggerBackgroundProbe, getInMemoryCachedPayload } = await import("../background-probe");

    expect(await triggerBackgroundProbe()).toBe(true);
    await vi.waitFor(() => expect(mocks.eval).toHaveBeenCalledOnce());
    expect(mocks.setex).not.toHaveBeenCalled();
    expect(getInMemoryCachedPayload()).toBeNull();
    expect(mocks.lockToken).toBeNull();
  });

  it.each(["open", "half-open"] as const)("skips stats, cache write, and lock release if circuit becomes %s during the probe", async (circuit) => {
    let resolve!: (value: Record<string, SourceHealthSnapshot>) => void;
    mocks.probe.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const { triggerBackgroundProbe, getInMemoryCachedPayload } = await import("../background-probe");
    expect(await triggerBackgroundProbe()).toBe(true);
    mocks.circuit = circuit;
    resolve({ source: {
      sourceId: "source", status: "HEALTHY", latencyMs: 50,
      lastCheckedAt: "2026-11-05T00:00:00.000Z", resolvedHost: "https://source.example",
      lastSuccessAt: null, lastFailureAt: null, consecutiveFailures: 0,
    } });

    await vi.waitFor(() => expect(getInMemoryCachedPayload()?.data.source.status).toBe("online"));
    expect(mocks.stats).not.toHaveBeenCalled();
    expect(mocks.setex).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
  });

  it("retains the in-memory result when cache persistence fails and still releases the lock", async () => {
    mocks.setex.mockRejectedValueOnce(new Error("connection closed"));
    const { triggerBackgroundProbe, getInMemoryCachedPayload } = await import("../background-probe");
    expect(await triggerBackgroundProbe()).toBe(true);
    await vi.waitFor(() => expect(mocks.eval).toHaveBeenCalledOnce());
    expect(getInMemoryCachedPayload()).toMatchObject({ data: {}, meta: { cached: true } });
  });

  it("does not release the lock after cache persistence opens the quota circuit", async () => {
    mocks.setex.mockImplementationOnce(async () => {
      mocks.circuit = "open";
      throw new Error("ERR max requests limit exceeded");
    });
    const { triggerBackgroundProbe, getInMemoryCachedPayload } = await import("../background-probe");
    expect(await triggerBackgroundProbe()).toBe(true);
    await vi.waitFor(() => expect(mocks.setex).toHaveBeenCalledOnce());
    expect(getInMemoryCachedPayload()).not.toBeNull();
    expect(mocks.eval).not.toHaveBeenCalled();
  });
});
