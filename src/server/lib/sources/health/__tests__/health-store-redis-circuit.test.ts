import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceHealthSnapshot } from "../types";
import { SourceHealthStore } from "../health-store";

const mocks = vi.hoisted(() => ({
  allowed: false,
  get: vi.fn(),
  setex: vi.fn(),
  lpush: vi.fn(),
  ltrim: vi.fn(),
  expire: vi.fn(),
  mget: vi.fn(),
  lrange: vi.fn(),
}));

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  isRedisCommandAllowed: () => mocks.allowed,
  redis: {
    get: mocks.get,
    setex: mocks.setex,
    lpush: mocks.lpush,
    ltrim: mocks.ltrim,
    expire: mocks.expire,
    mget: mocks.mget,
    lrange: mocks.lrange,
  },
}));

const snapshot: SourceHealthSnapshot = {
  sourceId: "shinigami",
  status: "BROKEN",
  stage: "search",
  latencyMs: 100,
  resolvedHost: "https://api.shngm.io",
  lastCheckedAt: "2026-11-22T01:00:00.000Z",
  lastSuccessAt: null,
  lastFailureAt: "2026-11-22T01:00:00.000Z",
  consecutiveFailures: 1,
  lastFailureCode: "SOURCE_DOWN",
};

describe("health snapshot persistence when Redis quota circuit is open", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.allowed = false;
    mocks.get.mockResolvedValue(null);
    mocks.setex.mockResolvedValue("OK");
    mocks.lpush.mockResolvedValue(1);
    mocks.ltrim.mockResolvedValue("OK");
    mocks.expire.mockResolvedValue(1);
    mocks.mget.mockResolvedValue([]);
    mocks.lrange.mockResolvedValue([]);
  });

  it("records in memory and avoids all Redis operations while commands are blocked", async () => {
    const store = new SourceHealthStore();
    await store.recordSnapshot(snapshot);
    expect((await store.getSnapshot("shinigami"))?.status).toBe("BROKEN");
    expect((await store.getAllSnapshots(["shinigami"])).shinigami).toBeDefined();
    expect((await store.getRollingStats("shinigami")).totalSamples).toBe(1);
    for (const op of [mocks.get, mocks.setex, mocks.lpush, mocks.ltrim, mocks.expire, mocks.mget, mocks.lrange]) {
      expect(op).not.toHaveBeenCalled();
    }
  });

  it("persists again when the circuit allows commands", async () => {
    const store = new SourceHealthStore();
    mocks.allowed = true;
    await store.recordSnapshot(snapshot);
    expect(mocks.get).toHaveBeenCalledWith("yomirra:health:snapshot:shinigami");
    expect(mocks.setex).toHaveBeenCalledOnce();
    expect(mocks.lpush).toHaveBeenCalledOnce();
    expect(mocks.ltrim).toHaveBeenCalledOnce();
    expect(mocks.expire).toHaveBeenCalledOnce();
  });
});
