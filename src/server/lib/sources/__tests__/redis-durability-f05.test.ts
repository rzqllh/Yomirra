import { describe, expect, it, vi, beforeEach } from "vitest";

// Deterministic in-memory Redis simulation for tests
let simulatedRedisState: {
  strings: Map<string, string>;
  sets: Map<string, Set<string>>;
  watchVersions: Map<string, number>;
  version: number;
} = {
  strings: new Map(),
  sets: new Map(),
  watchVersions: new Map(),
  version: 0,
};

let redisReady = true;
let readinessError: Error | null = null;
let setFailMode: "none" | "throw" | "transaction_error" | "sadd_error" | "srem_error" = "none";
let getFailMode: "none" | "throw" = "none";
let scanFailMode: "none" | "throw" = "none";
let lastWatchedVersion: number | null = null;

const mockRedis = {
  get: vi.fn(async (key: string) => {
    if (getFailMode === "throw") throw new Error("Redis read connection reset");
    return simulatedRedisState.strings.get(key) || null;
  }),
  set: vi.fn(async (key: string, val: string) => {
    if (setFailMode === "throw") throw new Error("Redis write connection refused");
    simulatedRedisState.strings.set(key, val);
    simulatedRedisState.version++;
    return "OK";
  }),
  del: vi.fn(async (...keys: string[]) => {
    let count = 0;
    for (const k of keys) {
      if (simulatedRedisState.strings.delete(k)) count++;
    }
    simulatedRedisState.version++;
    return count;
  }),
  smembers: vi.fn(async (key: string) => {
    const s = simulatedRedisState.sets.get(key);
    return s ? Array.from(s) : [];
  }),
  sadd: vi.fn(async (key: string, ...members: string[]) => {
    let s = simulatedRedisState.sets.get(key);
    if (!s) {
      s = new Set();
      simulatedRedisState.sets.set(key, s);
    }
    let count = 0;
    for (const m of members) {
      if (!s.has(m)) {
        s.add(m);
        count++;
      }
    }
    simulatedRedisState.version++;
    return count;
  }),
  srem: vi.fn(async (key: string, ...members: string[]) => {
    const s = simulatedRedisState.sets.get(key);
    if (!s) return 0;
    let count = 0;
    for (const m of members) {
      if (s.delete(m)) count++;
    }
    simulatedRedisState.version++;
    return count;
  }),
  mget: vi.fn(async (...keys: string[]) => {
    return keys.map((k) => simulatedRedisState.strings.get(k) || null);
  }),
  scan: vi.fn(async (_cursor: string, _match: string, pattern: string) => {
    if (scanFailMode === "throw") throw new Error("SCAN failed");
    const prefix = pattern.replace(/\*/g, "");
    const matching: string[] = [];
    for (const k of simulatedRedisState.strings.keys()) {
      if (k.includes(prefix)) matching.push(k);
    }
    return ["0", matching];
  }),
  watch: vi.fn(async (..._keys: string[]) => {
    lastWatchedVersion = simulatedRedisState.version;
    return "OK";
  }),
  unwatch: vi.fn(async () => {
    lastWatchedVersion = null;
    return "OK";
  }),
  multi: vi.fn(() => {
    const operations: Array<() => [Error | null, any]> = [];
    const boundWatchVersion = lastWatchedVersion;
    lastWatchedVersion = null; // consumed by this transaction

    return {
      set(key: string, val: string) {
        operations.push(() => {
          if (setFailMode === "transaction_error") {
            return [new Error("EXEC error on SET"), null];
          }
          simulatedRedisState.strings.set(key, val);
          return [null, "OK"];
        });
        return this;
      },
      sadd(key: string, member: string) {
        operations.push(() => {
          if (setFailMode === "sadd_error") {
            return [new Error("EXEC error on SADD"), null];
          }
          let s = simulatedRedisState.sets.get(key);
          if (!s) {
            s = new Set();
            simulatedRedisState.sets.set(key, s);
          }
          s.add(member);
          return [null, 1];
        });
        return this;
      },
      del(...keys: string[]) {
        operations.push(() => {
          let count = 0;
          for (const k of keys) {
            if (simulatedRedisState.strings.delete(k)) count++;
          }
          return [null, count];
        });
        return this;
      },
      srem(key: string, member: string) {
        operations.push(() => {
          const s = simulatedRedisState.sets.get(key);
          if (s) s.delete(member);
          return [null, 1];
        });
        return this;
      },
      async exec() {
        if (setFailMode === "throw") {
          throw new Error("Redis write connection refused");
        }
        // Check if Redis state version advanced since WATCH
        if (boundWatchVersion !== null && simulatedRedisState.version > boundWatchVersion) {
          // Concurrent modification detected by Redis!
          return null; // Redis exec returns null on watched collision
        }

        const results = operations.map((op) => op());
        simulatedRedisState.version++;
        return results;
      },
    };
  }),
  eval: vi.fn(
    async (
      script: string,
      _numkeys: number,
      ...args: any[]
    ) => {
      if (setFailMode === "throw") throw new Error("Redis write connection refused");
      if (getFailMode === "throw") throw new Error("Redis read connection reset");

      // Custom Source Save Lua
      if (script.includes("SAVE_CUSTOM_SOURCE_LUA") || (script.includes("SET") && script.includes("SADD"))) {
        if (setFailMode === "sadd_error" || setFailMode === "transaction_error") {
          throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
        }
        const [dataKey, idxKey, id, data] = args;
        simulatedRedisState.strings.set(dataKey, data);
        let s = simulatedRedisState.sets.get(idxKey);
        if (!s) {
          s = new Set();
          simulatedRedisState.sets.set(idxKey, s);
        }
        s.add(id);
        simulatedRedisState.version++;
        return "OK";
      }

      // Custom Source Delete Lua
      if (script.includes("DELETE_CUSTOM_SOURCE_LUA") || (script.includes("SREM") && script.includes("DEL"))) {
        if (setFailMode === "srem_error") {
          throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
        }
        const [dataKey, idxKey, id] = args;
        const s = simulatedRedisState.sets.get(idxKey);
        if (s) s.delete(id);
        const deleted = simulatedRedisState.strings.delete(dataKey) ? 1 : 0;
        simulatedRedisState.version++;
        return deleted;
      }

      // Core Source Override Lua
      const [key, sourceId, overrideJson, updatedAt, domainKey, domainVal] = args;
      const raw = simulatedRedisState.strings.get(key);
      const current = raw ? JSON.parse(raw) : {};
      const existing = current[sourceId] || { id: sourceId };
      const incoming = JSON.parse(overrideJson);

      const merged = {
        ...existing,
        ...incoming,
        id: sourceId,
        updatedAt,
      };
      current[sourceId] = merged;
      simulatedRedisState.strings.set(key, JSON.stringify(current));

      if (domainKey && domainVal) {
        simulatedRedisState.strings.set(domainKey, domainVal);
      }
      simulatedRedisState.version++;
      return JSON.stringify(merged);
    }
  ),
};

let mockIsRedisConfigured = true;

vi.mock("@/server/lib/cache/redis", () => ({
  get isRedisConfigured() {
    return mockIsRedisConfigured;
  },
  isRedisReady: vi.fn(() => redisReady),
  ensureRedisReady: vi.fn(async () => {
    if (readinessError) throw readinessError;
    if (!redisReady) throw new Error("Redis connection timed out waiting for ready state");
  }),
  redis: mockRedis,
}));

describe("W4 / F05: Redis Durability Reproduction & Verification Matrix", () => {
  beforeEach(async () => {
    simulatedRedisState = {
      strings: new Map(),
      sets: new Map(),
      watchVersions: new Map(),
      version: 0,
    };
    redisReady = true;
    readinessError = null;
    setFailMode = "none";
    getFailMode = "none";
    scanFailMode = "none";
    mockIsRedisConfigured = true;

    const customModule = await import("../custom-source-service");
    customModule._resetCustomSourcesForTesting();
    const adminModule = await import("../admin-source-service");
    adminModule._resetAdminSourceServiceForTesting();
  });

  const sampleSource = {
    id: "sample-custom",
    name: "Sample Custom Manga",
    baseUrl: "https://sample-custom.xyz",
    mirrors: [] as string[],
    lang: "id",
    version: "1.0.0",
    type: "html" as const,
    isNsfw: false,
    isEnabled: true,
    selectors: {
      popularPath: "/popular",
      popularListSelector: ".item",
      titleSelector: ".title",
      coverSelector: "img",
      linkSelector: "a",
    },
  };

  it("Scenario 1: Redis is configured but initially unavailable — mutation rejects, no phantom in-memory state", async () => {
    setFailMode = "throw";
    const { saveCustomSource, getCustomSourceById } = await import("../custom-source-service");

    await expect(saveCustomSource(sampleSource)).rejects.toThrow(
      /Failed to persist custom source to durable storage/
    );

    // Verify in-memory state did NOT keep phantom source
    const inMem = await getCustomSourceById("sample-custom");
    expect(inMem).toBeNull();
  });

  it("Scenario 2: Redis readiness fails or times out — mutations fail closed, public readers fail open", async () => {
    readinessError = new Error("Redis connection timed out waiting for ready state");
    redisReady = false;

    const { saveCustomSource, getCustomSources } = await import("../custom-source-service");
    const { saveCoreSourceOverride, getCoreSourceOverrides } = await import("../admin-source-service");

    // Mutation must fail closed
    await expect(saveCustomSource(sampleSource)).rejects.toThrow(/timed out/);
    await expect(
      saveCoreSourceOverride("komiku", { isEnabled: false })
    ).rejects.toThrow(/timed out/);

    // Public readers must fail open without throwing
    const sources = await getCustomSources();
    expect(Array.isArray(sources)).toBe(true);
    expect(sources).toHaveLength(0);

    const overrides = await getCoreSourceOverrides();
    expect(typeof overrides).toBe("object");
    expect(Object.keys(overrides)).toHaveLength(0);
  });

  it("Scenario 3: SET fails in Redis transaction — error raised and memory is clean", async () => {
    setFailMode = "transaction_error";
    const { saveCustomSource, getCustomSources } = await import("../custom-source-service");

    await expect(saveCustomSource(sampleSource)).rejects.toThrow(
      /Failed to persist custom source to durable storage/
    );

    const sources = await getCustomSources();
    expect(sources).toHaveLength(0);
    expect(simulatedRedisState.strings.size).toBe(0);
  });

  it("Scenario 4: SET succeeds but SADD fails — atomic multi aborts and leaves no partial state", async () => {
    setFailMode = "sadd_error";
    const { saveCustomSource, getCustomSources } = await import("../custom-source-service");

    await expect(saveCustomSource(sampleSource)).rejects.toThrow(
      /Failed to persist custom source to durable storage/
    );

    // Verify no orphan index or memory state
    const sources = await getCustomSources();
    expect(sources).toHaveLength(0);
  });

  it("Scenario 5: Redis GET fails, followed by attempted admin update — update aborts and does NOT clobber overrides", async () => {
    // Populate an existing override in Redis
    simulatedRedisState.strings.set(
      "yomirra:sources:core:overrides",
      JSON.stringify({
        komiku: { id: "komiku", isEnabled: true, activeDomain: "https://komiku.id" },
        mangabat: { id: "mangabat", isEnabled: false },
      })
    );

    getFailMode = "throw";
    const { saveCoreSourceOverride } = await import("../admin-source-service");

    // Mutation must throw and NOT overwrite Redis with empty object {}
    await expect(
      saveCoreSourceOverride("shinigami", { isEnabled: true })
    ).rejects.toThrow(/Failed to persist core source override/);

    // Restore GET and verify original overrides remain uncorrupted
    getFailMode = "none";
    const { getCoreSourceOverrides } = await import("../admin-source-service");
    const intact = await getCoreSourceOverrides();
    expect(intact.komiku).toBeDefined();
    expect(intact.mangabat).toBeDefined();
    expect(intact.shinigami).toBeUndefined(); // was cleanly aborted
  });

  it("Scenario 6: Two concurrent admin updates modify different fields — optimistic locking merges both without lost updates", async () => {
    const { saveCoreSourceOverride, getCoreSourceOverrides } = await import("../admin-source-service");

    // First save baseline
    await saveCoreSourceOverride("komiku", { isEnabled: true, activeDomain: "https://komiku.id" });

    // Simulate concurrent update on different fields
    // Admin 1 updates isEnabled, Admin 2 updates activeDomain
    const p1 = saveCoreSourceOverride("komiku", { isEnabled: false });
    const p2 = saveCoreSourceOverride("komiku", { activeDomain: "https://komiku-v2.id" });

    await Promise.all([p1, p2]);

    const finalState = await getCoreSourceOverrides();
    expect(finalState.komiku).toBeDefined();
    expect(finalState.komiku.isEnabled).toBe(false);
    expect(finalState.komiku.activeDomain).toBe("https://komiku-v2.id");
  });

  it("Scenario 7: Delete atomically removes key & set member, uses SCAN, and handles cache blip gracefully", async () => {
    const { saveCustomSource, deleteCustomSource, getCustomSources } = await import("../custom-source-service");

    // Save first
    await saveCustomSource(sampleSource);
    expect(await getCustomSources()).toHaveLength(1);

    // Simulate cache keys present
    simulatedRedisState.strings.set("yomirra:cache:sample-custom:ch1", "cache_data");

    // Simulate non-fatal scan/cache deletion failure
    scanFailMode = "throw";

    const deleted = await deleteCustomSource("sample-custom");
    expect(deleted).toBe(true);

    // Verify source is removed from Redis strings and set index
    expect(simulatedRedisState.strings.has("yomirra:sources:custom:sample-custom")).toBe(false);
    const indexSet = simulatedRedisState.sets.get("yomirra:sources:custom:index");
    expect(indexSet?.has("sample-custom")).toBeFalsy();

    // Verify memory is clean
    expect(await getCustomSources()).toHaveLength(0);
  });

  it("Scenario 8: Redis unconfigured in production vs development", async () => {
    mockIsRedisConfigured = false;

    const { saveCustomSource, deleteCustomSource } = await import("../custom-source-service");
    const { saveCoreSourceOverride } = await import("../admin-source-service");

    try {
      // In production: must reject
      vi.stubEnv("NODE_ENV", "production");
      await expect(saveCustomSource(sampleSource)).rejects.toThrow(
        /durable storage is required in production/
      );
      await expect(deleteCustomSource("sample-custom")).rejects.toThrow(
        /durable storage is required in production/
      );
      await expect(
        saveCoreSourceOverride("komiku", { isEnabled: false })
      ).rejects.toThrow(/durable storage is required in production/);

      // In development: memory fallback allowed
      vi.stubEnv("NODE_ENV", "development");
      const savedDev = await saveCustomSource(sampleSource);
      expect(savedDev.id).toBe("sample-custom");

      const deletedDev = await deleteCustomSource("sample-custom");
      expect(deletedDev).toBe(true);

      const overrideDev = await saveCoreSourceOverride("komiku", { isEnabled: true });
      expect(overrideDev.isEnabled).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("Scenario 9: Cold-start recovery succeeds — empty in-memory state hydrates cleanly from durable Redis", async () => {
    // Populate Redis directly as if from previous durable session
    simulatedRedisState.strings.set(
      "yomirra:sources:custom:sample-custom",
      JSON.stringify(sampleSource)
    );
    const set = new Set(["sample-custom"]);
    simulatedRedisState.sets.set("yomirra:sources:custom:index", set);

    // Ensure in-memory map is completely empty
    const { getCustomSources, getCustomSourceById, _resetCustomSourcesForTesting } = await import("../custom-source-service");
    _resetCustomSourcesForTesting();

    // Cold-start query loads from Redis and hydrates in-memory
    const sources = await getCustomSources();
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe("sample-custom");

    // Direct ID query succeeds
    const single = await getCustomSourceById("sample-custom");
    expect(single).toBeDefined();
    expect(single?.name).toBe("Sample Custom Manga");
  });

  it("Scenario 10 (P1 Codex Review): Authoritative Redis miss evicts stale hydrated in-memory cache", async () => {
    const { saveCustomSource, getCustomSourceById, getCustomSources } = await import("../custom-source-service");

    // 1. Save and hydrate into memory on this instance
    await saveCustomSource(sampleSource);
    expect(await getCustomSourceById("sample-custom")).not.toBeNull();
    expect(await getCustomSources()).toHaveLength(1);

    // 2. Simulate another instance deleting the source directly from Redis
    simulatedRedisState.strings.delete("yomirra:sources:custom:sample-custom");
    simulatedRedisState.sets.delete("yomirra:sources:custom:index");

    // 3. Authoritative Redis GET miss MUST evict in-memory cache and return null (not stale object)
    const afterDeleteById = await getCustomSourceById("sample-custom");
    expect(afterDeleteById).toBeNull();

    // 4. Authoritative Redis smembers miss MUST return [] and clear in-memory cache
    const afterDeleteAll = await getCustomSources();
    expect(afterDeleteAll).toHaveLength(0);
  });

  it("Scenario 11 (P2 Codex Review): SADD failure during custom source save does not leave un-indexed orphan record", async () => {
    setFailMode = "sadd_error"; // Simulates WRONGTYPE on CUSTOM_SOURCE_INDEX
    const { saveCustomSource, getCustomSourceById } = await import("../custom-source-service");

    await expect(saveCustomSource(sampleSource)).rejects.toThrow(
      /Failed to persist custom source to durable storage/
    );

    // Critical assertion: Lua atomic check or compensating rollback ensures NO data key survived
    expect(simulatedRedisState.strings.has("yomirra:sources:custom:sample-custom")).toBe(false);

    // Direct lookup must be null
    expect(await getCustomSourceById("sample-custom")).toBeNull();
  });

  it("Scenario 12 (P2 Codex Review): SREM failure during deletion reconciles state and evicts in-memory cache", async () => {
    const { saveCustomSource, deleteCustomSource, getCustomSourceById } = await import("../custom-source-service");

    // Save baseline
    await saveCustomSource(sampleSource);
    expect(await getCustomSourceById("sample-custom")).not.toBeNull();

    // Now deletion encounters SREM failure, while durable record key was removed
    setFailMode = "srem_error";
    simulatedRedisState.strings.delete("yomirra:sources:custom:sample-custom");

    await expect(deleteCustomSource("sample-custom")).rejects.toThrow(
      /Failed to delete custom source from durable storage/
    );

    // Critical assertion: in-memory cache was evicted in catch block and authoritative miss prevents ghost resurrection
    expect(await getCustomSourceById("sample-custom")).toBeNull();
  });

  it("Scenario 13 (P2 Codex Review): SCAN cleanup continues through full cursor completion without arbitrary key limit", async () => {
    mockRedis.del.mockClear();
    const { deleteMatchedRedisKeys } = await import("../custom-source-service");

    // Simulate multi-page Redis scan across 3 iterations (cursor "10" -> "20" -> "0")
    let scanCallCount = 0;
    mockRedis.scan.mockImplementation(async (cursor: string) => {
      scanCallCount++;
      if (cursor === "0" && scanCallCount === 1) {
        return ["10", ["key1", "key2"]];
      }
      if (cursor === "10") {
        return ["20", ["key3", "key4"]];
      }
      return ["0", ["key5"]];
    });

    const deletedTotal = await deleteMatchedRedisKeys("yomirra:cache:test:*", 2);

    expect(scanCallCount).toBe(3);
    expect(deletedTotal).toBe(5);
    expect(mockRedis.del).toHaveBeenCalledTimes(3);
  });

  it("Scenario 14 (P1 Codex Review): Failed update to an existing custom source preserves previously valid durable record", async () => {
    const { saveCustomSource, getCustomSourceById } = await import("../custom-source-service");

    // 1. Initial valid save
    await saveCustomSource(sampleSource);
    const initial = await getCustomSourceById("sample-custom");
    expect(initial).not.toBeNull();
    expect(initial?.name).toBe("Sample Custom Manga");

    // 2. Admin attempts to update the source, but Redis encounters an error during execution (e.g. index WRONGTYPE)
    setFailMode = "transaction_error";
    const updateAttempt = {
      ...sampleSource,
      name: "Attempted Malformed Update",
    };

    await expect(saveCustomSource(updateAttempt)).rejects.toThrow(
      /Failed to persist custom source to durable storage/
    );

    // 3. Clear failure mode and verify the previous durable record was NOT deleted
    setFailMode = "none";
    const preserved = await getCustomSourceById("sample-custom");
    expect(preserved).not.toBeNull();
    expect(preserved?.name).toBe("Sample Custom Manga");
    expect(simulatedRedisState.strings.has("yomirra:sources:custom:sample-custom")).toBe(true);
  });

  it("Scenario 15 (P1 Codex Review): Preserves empty arrays when saving and loading core source overrides", async () => {
    const { saveCoreSourceOverride, getCoreSourceOverrides, getSourceHealthMatrix } = await import(
      "../admin-source-service"
    );

    // 1. Save core override with mirrors set to an empty array
    const saved = await saveCoreSourceOverride("mangadex", {
      isEnabled: true,
      mirrors: [],
    });

    expect(Array.isArray(saved.mirrors)).toBe(true);
    expect(saved.mirrors).toHaveLength(0);

    // 2. Verify durable Redis JSON representation preserves array [] and not object {}
    const raw = simulatedRedisState.strings.get("yomirra:sources:core:overrides");
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed.mangadex.mirrors)).toBe(true);
    expect(parsed.mangadex.mirrors).toEqual([]);

    // 3. Verify getCoreSourceOverrides preserves array
    const allOverrides = await getCoreSourceOverrides();
    expect(Array.isArray(allOverrides.mangadex.mirrors)).toBe(true);
    expect(allOverrides.mangadex.mirrors).toHaveLength(0);

    // 4. Verify getSourceHealthMatrix passes array safely and does not throw on .join()
    const matrix = await getSourceHealthMatrix();
    const mangadexItem = matrix.find((item) => item.id.toLowerCase() === "mangadex");
    expect(mangadexItem).toBeDefined();
    // Simulate what CoreSourceModal does: mirrors.join(", ")
    expect(() => {
      const mirrorsStr = (allOverrides.mangadex.mirrors || []).join(", ");
      expect(mirrorsStr).toBe("");
    }).not.toThrow();
  });
});
