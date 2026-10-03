import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => {
  const store = new Map<string, string>();
  const zset = new Map<string, number>();

  return {
    store,
    zset,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    mget: vi.fn(async (keys: string[]) => keys.map((k) => store.get(k) ?? null)),
    set: vi.fn(async (key: string, val: string) => {
      store.set(key, val);
      return "OK";
    }),
    zadd: vi.fn(async (_key: string, score: number, member: string) => {
      zset.set(member, score);
      return 1;
    }),
    zcard: vi.fn(async () => zset.size),
    zrange: vi.fn(async (_key: string, start: number, stop: number) => {
      const sorted = Array.from(zset.entries()).sort((a, b) => a[1] - b[1]);
      return sorted.slice(start, stop + 1).map((e) => e[0]);
    }),
    zrevrange: vi.fn(async (_key: string, start: number, stop: number) => {
      const sorted = Array.from(zset.entries()).sort((a, b) => b[1] - a[1]);
      return sorted.slice(start, stop + 1).map((e) => e[0]);
    }),
    zremrangebyrank: vi.fn(async () => 1),
    pipeline: vi.fn(() => {
      const ops: Array<() => void> = [];
      return {
        set(key: string, val: string) {
          ops.push(() => store.set(key, val));
          return this;
        },
        zadd(_key: string, score: number, member: string) {
          ops.push(() => zset.set(member, score));
          return this;
        },
        del(key: string) {
          ops.push(() => store.delete(key));
          return this;
        },
        zremrangebyrank(_key: string, _start: number, _stop: number) {
          return this;
        },
        exec: vi.fn(async () => {
          ops.forEach((op) => op());
          return [];
        }),
      };
    }),
  };
});

vi.mock("@/server/lib/cache/redis", () => ({
  isRedisConfigured: true,
  redis: redisMock,
}));

import {
  hashEmbeddingText,
  upsertSearchCatalogRecords,
  getSearchCatalogRecord,
  getRecentSearchCatalogRecords,
  buildTrustedCatalogCandidate,
} from "../semantic-catalog";

describe("Phase 5.3 & 5.4 — Progressive Indexing and Vector Catalog Invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.store.clear();
    redisMock.zset.clear();
  });

  it("produces deterministic sha256 hashes for embedding text", () => {
    const hash1 = hashEmbeddingText("Solo Leveling Manhwa Action");
    const hash2 = hashEmbeddingText("Solo Leveling Manhwa Action");
    const hash3 = hashEmbeddingText("One Piece Manga Adventure");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it("builds trusted catalog candidate from manga item", () => {
    const candidate = buildTrustedCatalogCandidate("shinigami", {
      id: "sl-1",
      title: "Solo Leveling",
      coverUrl: "https://shini.io/cover.jpg",
      latestChapter: "Ch. 179",
      format: "Manhwa",
    });

    expect(candidate.canonicalKey).toBe("source:shinigami:sl-1");
    expect(candidate.sourceId).toBe("shinigami");
    expect(candidate.title).toBe("Solo Leveling");
    expect(candidate.sourceBindings).toHaveLength(1);
    expect(candidate.sourceBindings?.[0].sourceId).toBe("shinigami");
  });

  it("upserts catalog records with embedding text hash and retrieves them", async () => {
    const candidate = buildTrustedCatalogCandidate("shinigami", {
      id: "sl-1",
      title: "Solo Leveling",
      coverUrl: "https://shini.io/cover.jpg",
    });

    const embeddings = new Map([
      [candidate.canonicalKey, { values: [0.1, 0.2, 0.3], textHash: "hash-v1" }],
    ]);

    await upsertSearchCatalogRecords([candidate], embeddings);

    const record = await getSearchCatalogRecord(candidate.canonicalKey);
    expect(record).not.toBeNull();
    expect(record?.canonicalKey).toBe(candidate.canonicalKey);
    expect(record?.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(record?.embeddingTextHash).toBe("hash-v1");
  });

  it("updates embeddings when candidate text changes", async () => {
    const candidate = buildTrustedCatalogCandidate("shinigami", {
      id: "sl-1",
      title: "Solo Leveling",
      coverUrl: "https://shini.io/cover.jpg",
    });

    // Initial upsert
    await upsertSearchCatalogRecords(
      [candidate],
      new Map([[candidate.canonicalKey, { values: [0.1, 0.2], textHash: "hash-v1" }]])
    );

    // Content updated
    const updatedCandidate = {
      ...candidate,
      description: "Updated description with new lore",
    };
    await upsertSearchCatalogRecords(
      [updatedCandidate],
      new Map([[candidate.canonicalKey, { values: [0.8, 0.9], textHash: "hash-v2" }]])
    );

    const record = await getSearchCatalogRecord(candidate.canonicalKey);
    expect(record?.embedding).toEqual([0.8, 0.9]);
    expect(record?.embeddingTextHash).toBe("hash-v2");
    expect(record?.description).toBe("Updated description with new lore");
  });

  it("handles redis outage fail-safe without throwing", async () => {
    redisMock.mget.mockRejectedValueOnce(new Error("Redis connection lost"));

    const candidate = buildTrustedCatalogCandidate("shinigami", {
      id: "sl-fail",
      title: "Solo Leveling",
      coverUrl: "https://shini.io/cover.jpg",
    });

    // Must not throw
    await expect(upsertSearchCatalogRecords([candidate])).resolves.not.toThrow();

    redisMock.get.mockRejectedValueOnce(new Error("Redis offline"));
    const record = await getSearchCatalogRecord(candidate.canonicalKey);
    expect(record).toBeNull();

    redisMock.zrevrange.mockRejectedValueOnce(new Error("Redis timeout"));
    const recent = await getRecentSearchCatalogRecords(50);
    expect(recent).toEqual([]);
  });
});
