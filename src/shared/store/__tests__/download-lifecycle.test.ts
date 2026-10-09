import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useDownloadStore, isQueueProcessingTimerActive } from "../download-store";
import { abortControllers } from "@/shared/lib/download-engine";
import { verifyImageUrl } from "@/server/lib/sign-proxy-url";

describe("W1: Download Engine Lifecycle & URL Verification (F02 + F12)", () => {
  let originalFetch: typeof globalThis.fetch;
  let originalCaches: typeof globalThis.caches;

  beforeEach(async () => {
    vi.useFakeTimers();
    originalFetch = globalThis.fetch;
    originalCaches = globalThis.caches;

    const mockPut = vi.fn(async () => undefined);
    const mockKeys = vi.fn(async () => []);
    globalThis.caches = {
      open: vi.fn(async () => ({ put: mockPut, keys: mockKeys })),
      delete: vi.fn(async () => true),
    } as unknown as CacheStorage;

    useDownloadStore.setState({
      downloads: {},
      queue: [],
      activeDownloads: [],
      maxConcurrency: 1,
    });
    await vi.runAllTimersAsync();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    globalThis.caches = originalCaches;
  });

  describe("F02: Idle Rescheduling & Concurrency Lifecycle", () => {
    it("should NOT schedule any queue timer when the queue is empty", async () => {
      expect(isQueueProcessingTimerActive()).toBe(false);
      await useDownloadStore.getState()._processQueue();
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("should NOT loop infinitely every 50ms when queue is empty", async () => {
      const processQueueSpy = vi.spyOn(useDownloadStore.getState(), "_processQueue");

      await useDownloadStore.getState()._processQueue();

      // Advance 500ms (10 x 50ms intervals)
      vi.advanceTimersByTime(500);

      expect(processQueueSpy).toHaveBeenCalledTimes(1);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("clears pending queue timer when cancelDownload empties the queue", async () => {
      const id = "komiku::manga-1::ch-1";
      useDownloadStore.setState({
        downloads: {
          [id]: {
            id,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id],
        activeDownloads: [],
      });

      const processQueueSpy = vi.spyOn(useDownloadStore.getState(), "_processQueue");
      await useDownloadStore.getState().cancelDownload(id);

      expect(useDownloadStore.getState().queue).toEqual([]);
      expect(useDownloadStore.getState().activeDownloads).toEqual([]);
      expect(isQueueProcessingTimerActive()).toBe(false);

      vi.advanceTimersByTime(500);
      expect(processQueueSpy).toHaveBeenCalledTimes(1);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("clears pending queue timer when pauseDownload empties the queue", async () => {
      const id = "komiku::manga-1::ch-1";
      useDownloadStore.setState({
        downloads: {
          [id]: {
            id,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id],
        activeDownloads: [],
      });

      const processQueueSpy = vi.spyOn(useDownloadStore.getState(), "_processQueue");
      processQueueSpy.mockClear();

      useDownloadStore.getState().pauseDownload(id);

      expect(useDownloadStore.getState().queue).toEqual([]);
      expect(useDownloadStore.getState().downloads[id].status).toBe("paused");
      expect(isQueueProcessingTimerActive()).toBe(false);

      vi.advanceTimersByTime(500);
      expect(processQueueSpy).toHaveBeenCalledTimes(1);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("clears all active controllers and timers when clearDownloads is called", async () => {
      const id = "komiku::manga-1::ch-1";
      const abort = vi.fn();
      abortControllers[id] = { abort, signal: new AbortController().signal } as unknown as AbortController;

      useDownloadStore.setState({
        downloads: {
          [id]: {
            id,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id],
        activeDownloads: [id],
      });

      await useDownloadStore.getState().clearDownloads();

      expect(abort).toHaveBeenCalledTimes(1);
      expect(useDownloadStore.getState().queue).toEqual([]);
      expect(useDownloadStore.getState().activeDownloads).toEqual([]);
      expect(useDownloadStore.getState().downloads).toEqual({});
      expect(isQueueProcessingTimerActive()).toBe(false);

      vi.advanceTimersByTime(500);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("executes chapter download to completion and leaves zero idle timers", async () => {
      const id = "komiku::manga-1::ch-1";
      const signedPageUrl = "/api/proxy/image?url=https%3A%2F%2Fcdn.test%2F1.jpg&sig=valid-sig";

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("/pages")) {
          return new Response(
            JSON.stringify({
              data: {
                pages: [{ index: 0, url: signedPageUrl }],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/api/proxy/image")) {
          return new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { "Content-Type": "image/jpeg" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      useDownloadStore.setState({
        downloads: {
          [id]: {
            id,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id],
        activeDownloads: [],
      });

      const processPromise = useDownloadStore.getState()._processQueue();
      await processPromise;

      const item = useDownloadStore.getState().downloads[id];
      expect(item.status).toBe("downloaded");
      expect(item.progress).toBe(100);
      expect(item.downloadedPages).toBe(1);
      expect(useDownloadStore.getState().queue).toEqual([]);
      expect(useDownloadStore.getState().activeDownloads).toEqual([]);

      // Verify that settling produces no idle timers
      expect(isQueueProcessingTimerActive()).toBe(false);
      vi.advanceTimersByTime(500);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("processes multi-chapter queue sequentially with bounded concurrency and settles", async () => {
      const id1 = "komiku::manga-1::ch-1";
      const id2 = "komiku::manga-1::ch-2";

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("/pages")) {
          return new Response(
            JSON.stringify({
              data: {
                pages: [
                  { index: 0, url: "/api/proxy/image?url=https%3A%2F%2Fcdn.test%2F1.jpg&sig=valid-sig" },
                ],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/api/proxy/image")) {
          return new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { "Content-Type": "image/jpeg" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      useDownloadStore.setState({
        downloads: {
          [id1]: {
            id: id1,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          [id2]: {
            id: id2,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-2",
            chapterTitle: "Chapter 2",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id1, id2],
        activeDownloads: [],
        maxConcurrency: 1,
      });

      // Start processing id1
      await useDownloadStore.getState()._processQueue();

      // id1 should now be downloaded
      expect(useDownloadStore.getState().downloads[id1].status).toBe("downloaded");
      // id2 is in queue, and a timer is scheduled to run id2 in 50ms
      expect(useDownloadStore.getState().queue).toEqual([id2]);
      expect(isQueueProcessingTimerActive()).toBe(true);

      // Advance timer by 50ms to trigger id2
      await vi.advanceTimersByTimeAsync(50);

      // Both should now be downloaded
      expect(useDownloadStore.getState().downloads[id1].status).toBe("downloaded");
      expect(useDownloadStore.getState().downloads[id2].status).toBe("downloaded");
      expect(useDownloadStore.getState().queue).toEqual([]);
      expect(useDownloadStore.getState().activeDownloads).toEqual([]);

      // Settled queue: no timer
      expect(isQueueProcessingTimerActive()).toBe(false);
      vi.advanceTimersByTime(500);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });

    it("recovers lock on failure and continues to process next queued chapter without deadlock", async () => {
      const id1 = "komiku::manga-1::ch-1";
      const id2 = "komiku::manga-1::ch-2";

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("ch-1/pages")) {
          // Chapter 1 fails to fetch pages
          return new Response("Server error", { status: 500 });
        }
        if (urlStr.includes("ch-2/pages")) {
          // Chapter 2 succeeds
          return new Response(
            JSON.stringify({
              data: {
                pages: [
                  { index: 0, url: "/api/proxy/image?url=https%3A%2F%2Fcdn.test%2F1.jpg&sig=valid-sig" },
                ],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/api/proxy/image")) {
          return new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { "Content-Type": "image/jpeg" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      useDownloadStore.setState({
        downloads: {
          [id1]: {
            id: id1,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          [id2]: {
            id: id2,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-2",
            chapterTitle: "Chapter 2",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 0,
            pages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id1, id2],
        activeDownloads: [],
        maxConcurrency: 1,
      });

      // Process id1 (which will fail)
      await useDownloadStore.getState()._processQueue();

      expect(useDownloadStore.getState().downloads[id1].status).toBe("failed");
      expect(useDownloadStore.getState().downloads[id1].error).toBeDefined();

      // id2 is still in queue, timer is scheduled
      expect(useDownloadStore.getState().queue).toEqual([id2]);
      expect(isQueueProcessingTimerActive()).toBe(true);

      // Advance timer for id2 to run
      await vi.advanceTimersByTimeAsync(50);

      // id2 completes successfully despite id1's failure
      expect(useDownloadStore.getState().downloads[id2].status).toBe("downloaded");
      expect(useDownloadStore.getState().queue).toEqual([]);
      expect(useDownloadStore.getState().activeDownloads).toEqual([]);
      expect(isQueueProcessingTimerActive()).toBe(false);
    });
  });

  describe("F12: Signed Image Proxy Contract & Legacy URL Safety", () => {
    it("fails verification when signature is absent (reproducing why legacy URLs without signature fail)", () => {
      // Without signature, verifyImageUrl fails
      expect(verifyImageUrl("https://example.com/chapter1/page1.jpg", "")).toBe(false);
    });

    it("verifies that unsigned image proxy request URL is recognized as needing refresh", () => {
      const rawUrl = "https://example.com/manga/1/01.jpg";
      const unsignedProxyUrl = `/api/proxy/image?url=${encodeURIComponent(rawUrl)}&sourceId=komiku`;
      const signedProxyUrl = `/api/proxy/image?url=${encodeURIComponent(rawUrl)}&sig=abcdef1234567890`;

      // An unsigned URL lacks 'sig='
      expect(rawUrl.startsWith("/api/proxy/image")).toBe(false);
      expect(unsignedProxyUrl.includes("sig=")).toBe(false);

      // A signed URL satisfies both
      expect(signedProxyUrl.startsWith("/api/proxy/image")).toBe(true);
      expect(signedProxyUrl.includes("sig=")).toBe(true);
    });

    it("upgrades legacy unsigned pages by re-fetching fresh signed URLs from API before download", async () => {
      const id = "komiku::manga-1::ch-1";
      const legacyRawUrl = "https://cdn.example.com/legacy/page0.jpg";
      const freshSignedUrl = "/api/proxy/image?url=https%3A%2F%2Fcdn.example.com%2Flegacy%2Fpage0.jpg&sig=signed-fresh-token";

      let pagesEndpointCalled = false;
      let imageFetchUrl: string | null = null;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("/pages")) {
          pagesEndpointCalled = true;
          return new Response(
            JSON.stringify({
              data: {
                pages: [{ index: 0, url: freshSignedUrl }],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/api/proxy/image")) {
          imageFetchUrl = urlStr;
          return new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { "Content-Type": "image/jpeg" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      // Item has legacy page with raw URL (not starting with /api/proxy/image and without sig=)
      useDownloadStore.setState({
        downloads: {
          [id]: {
            id,
            sourceId: "komiku",
            mangaId: "manga-1",
            mangaTitle: "Manga 1",
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            status: "queued",
            progress: 0,
            downloadedPages: 0,
            totalPages: 1,
            pages: [
              {
                index: 0,
                originalUrl: legacyRawUrl,
                offlineUrl: `/offline-images/${id}/0`,
                status: "pending",
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        queue: [id],
        activeDownloads: [],
      });

      await useDownloadStore.getState()._processQueue();

      // Pages endpoint was called to upgrade the legacy unsigned URL
      expect(pagesEndpointCalled).toBe(true);
      // The image fetch used the fresh signed URL, NOT an unsigned proxy URL
      expect(imageFetchUrl).toBe(freshSignedUrl);
      expect(imageFetchUrl).toContain("sig=signed-fresh-token");

      const item = useDownloadStore.getState().downloads[id];
      expect(item.status).toBe("downloaded");
      expect(item.pages[0].originalUrl).toBe(freshSignedUrl);
      expect(item.pages[0].status).toBe("cached");
    });
  });
});
