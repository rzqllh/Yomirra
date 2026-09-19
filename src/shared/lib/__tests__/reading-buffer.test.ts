import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  bufferChapterPages,
  isChapterBuffered,
  evictBufferedChapter,
  clearAutomaticCache,
  getBufferedPageRequestKey,
  getStorageEstimate,
  READING_BUFFER_CACHE_NAME,
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  MAX_BUFFERED_CHAPTERS,
} from "../reading-buffer";

// Mock Cache and CacheStorage implementation for tests
class MockCache {
  store = new Map<string, Response>();

  async match(key: string | Request) {
    const k = typeof key === "string" ? key : key.url;
    const res = this.store.get(k);
    return res ? res.clone() : undefined;
  }

  async put(key: string | Request, response: Response) {
    const k = typeof key === "string" ? key : key.url;
    this.store.set(k, response.clone());
  }

  async delete(key: string | Request) {
    const k = typeof key === "string" ? key : key.url;
    return this.store.delete(k);
  }
}

class MockCacheStorage {
  caches = new Map<string, MockCache>();

  async open(name: string) {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MockCache());
    }
    return this.caches.get(name)!;
  }

  async has(name: string) {
    return this.caches.has(name);
  }

  async keys() {
    return Array.from(this.caches.keys());
  }

  async delete(name: string) {
    return this.caches.delete(name);
  }
}

describe("Phase 9: Reading Buffer and Cache Management", () => {
  let mockCaches: MockCacheStorage;

  beforeEach(() => {
    localStorage.clear();
    mockCaches = new MockCacheStorage();
    vi.stubGlobal("caches", mockCaches);

    // Mock global fetch
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        return new Response(`image-data-for-${url}`, {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      })
    );
  });

  it("P9-01: generates deterministic buffered request keys", () => {
    const key = getBufferedPageRequestKey("mangadex", "manga-123", "ch-1", 0);
    expect(key).toBe("/reading-buffer/mangadex/manga-123/ch-1/0");
  });

  it("P9-02: buffers chapter pages into READING_BUFFER_CACHE_NAME", async () => {
    const pages = [
      { index: 0, url: "https://example.com/p0.jpg" },
      { index: 1, url: "https://example.com/p1.jpg" },
    ];

    const cachedCount = await bufferChapterPages({
      sourceId: "mangadex",
      mangaId: "manga-1",
      chapterId: "ch-1",
      pages,
    });

    expect(cachedCount).toBe(2);
    const buffered = await isChapterBuffered("mangadex", "manga-1", "ch-1");
    expect(buffered).toBe(true);

    const cache = await mockCaches.open(READING_BUFFER_CACHE_NAME);
    const p0 = await cache.match("/reading-buffer/mangadex/manga-1/ch-1/0");
    expect(p0).toBeDefined();
  });

  it("P9-03: strictly rejects buffering locked/premium chapters", async () => {
    const pages = [
      { index: 0, url: "https://example.com/locked0.jpg" },
      { index: 1, url: "https://example.com/locked1.jpg" },
    ];

    const cachedCount = await bufferChapterPages({
      sourceId: "asura",
      mangaId: "solo-leveling",
      chapterId: "ch-premium",
      pages,
      isLocked: true,
    });

    expect(cachedCount).toBe(0);
    const buffered = await isChapterBuffered("asura", "solo-leveling", "ch-premium");
    expect(buffered).toBe(false);
  });

  it("P9-04: enforces bounded chapter buffer and evicts oldest via LRU when exceeding MAX_BUFFERED_CHAPTERS", async () => {
    // MAX_BUFFERED_CHAPTERS is 2
    expect(MAX_BUFFERED_CHAPTERS).toBe(2);

    // Buffer Chapter 1
    await bufferChapterPages({
      sourceId: "src1",
      mangaId: "m1",
      chapterId: "ch-1",
      pages: [{ index: 0, url: "https://example.com/1.jpg" }],
    });

    // Buffer Chapter 2
    await bufferChapterPages({
      sourceId: "src1",
      mangaId: "m1",
      chapterId: "ch-2",
      pages: [{ index: 0, url: "https://example.com/2.jpg" }],
    });

    expect(await isChapterBuffered("src1", "m1", "ch-1")).toBe(true);
    expect(await isChapterBuffered("src1", "m1", "ch-2")).toBe(true);

    // Buffer Chapter 3 -> triggers LRU eviction of ch-1
    await bufferChapterPages({
      sourceId: "src1",
      mangaId: "m1",
      chapterId: "ch-3",
      pages: [{ index: 0, url: "https://example.com/3.jpg" }],
    });

    // ch-1 should be evicted, ch-2 and ch-3 should remain
    expect(await isChapterBuffered("src1", "m1", "ch-1")).toBe(false);
    expect(await isChapterBuffered("src1", "m1", "ch-2")).toBe(true);
    expect(await isChapterBuffered("src1", "m1", "ch-3")).toBe(true);
  });

  it("P9-05: clearAutomaticCache clears reading buffer but strictly preserves explicit downloads", async () => {
    // Put something in explicit downloads cache
    const downloadCache = await mockCaches.open(EXPLICIT_DOWNLOADS_CACHE_NAME);
    await downloadCache.put(
      "/download/ch-saved",
      new Response("downloaded-page-data", { status: 200 })
    );

    // Put something in reading buffer cache
    await bufferChapterPages({
      sourceId: "src1",
      mangaId: "m1",
      chapterId: "ch-temp",
      pages: [{ index: 0, url: "https://example.com/temp.jpg" }],
    });

    // Put something in image proxy cache
    const imgCache = await mockCaches.open("yomirra-manga-images");
    await imgCache.put("/proxy/img", new Response("img", { status: 200 }));

    expect(await mockCaches.has(EXPLICIT_DOWNLOADS_CACHE_NAME)).toBe(true);
    expect(await mockCaches.has(READING_BUFFER_CACHE_NAME)).toBe(true);

    // Run clearAutomaticCache
    const result = await clearAutomaticCache();

    // Verification of cache separation invariants
    expect(result.preserved).toBe(EXPLICIT_DOWNLOADS_CACHE_NAME);
    expect(await mockCaches.has(EXPLICIT_DOWNLOADS_CACHE_NAME)).toBe(true);
    expect(await downloadCache.match("/download/ch-saved")).toBeDefined();

    // Automatic caches should be deleted
    expect(await mockCaches.has(READING_BUFFER_CACHE_NAME)).toBe(false);
    expect(await mockCaches.has("yomirra-manga-images")).toBe(false);
    expect(await isChapterBuffered("src1", "m1", "ch-temp")).toBe(false);
  });

  it("P9-06: getStorageEstimate calculates usage and MB conversion accurately", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn().mockResolvedValue({
          usage: 50 * 1024 * 1024, // 50MB
          quota: 200 * 1024 * 1024, // 200MB
        }),
      },
    });

    const est = await getStorageEstimate();
    expect(est.usageMB).toBe(50);
    expect(est.quotaMB).toBe(200);
    expect(est.percentage).toBe(25);
    expect(est.isQuotaLow).toBe(false);
  });
});
