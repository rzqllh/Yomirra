import { beforeEach, describe, expect, it, vi } from "vitest";

const engineMocks = vi.hoisted(() => ({
  abortControllers: {} as Record<string, { abort: ReturnType<typeof vi.fn> }>,
  processDownloadQueue: vi.fn(async () => undefined),
  waitForDownloadCompletion: vi.fn(async () => undefined),
}));

const cacheMocks = vi.hoisted(() => ({
  deleteDownloadCacheEntries: vi.fn(async () => 2),
}));

vi.mock("@/shared/lib/download-engine", () => engineMocks);
vi.mock("@/shared/lib/download-cache", () => cacheMocks);

import { useDownloadStore, type DownloadChapter } from "../download-store";

describe("download store hygiene", () => {
  const id = "src::manga::chapter";

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(engineMocks.abortControllers)) {
      delete engineMocks.abortControllers[key];
    }
    useDownloadStore.setState({
      downloads: {},
      queue: [],
      activeDownloads: [],
    });
  });

  it("waits for an active job to settle, removes partial cache, and resets retry metadata on cancel", async () => {
    const abort = vi.fn();
    engineMocks.abortControllers[id] = { abort };

    const item: DownloadChapter = {
      id,
      sourceId: "src",
      mangaId: "manga",
      mangaTitle: "Manga",
      chapterId: "chapter",
      chapterTitle: "Chapter",
      status: "downloading",
      progress: 50,
      totalPages: 2,
      downloadedPages: 1,
      pages: [
        {
          index: 0,
          originalUrl: "https://example.com/0.jpg",
          offlineUrl: `/offline-images/${id}/0`,
          status: "cached",
          contentType: "image/jpeg",
          sizeBytes: 123,
        },
        {
          index: 1,
          originalUrl: "https://example.com/1.jpg",
          offlineUrl: `/offline-images/${id}/1`,
          status: "downloading",
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    };

    useDownloadStore.setState({
      downloads: { [id]: item },
      queue: [],
      activeDownloads: [id],
    });

    await useDownloadStore.getState().cancelDownload(id);

    expect(abort).toHaveBeenCalledTimes(1);
    expect(engineMocks.waitForDownloadCompletion).toHaveBeenCalledWith(id);
    expect(cacheMocks.deleteDownloadCacheEntries).toHaveBeenCalledWith(id);

    const cancelled = useDownloadStore.getState().downloads[id];
    expect(cancelled.status).toBe("failed");
    expect(cancelled.error).toBe("Dibatalkan pengguna");
    expect(cancelled.progress).toBe(0);
    expect(cancelled.downloadedPages).toBe(0);
    expect(cancelled.pages.every((page) => page.status === "pending")).toBe(true);
    expect(cancelled.pages.every((page) => page.contentType === undefined)).toBe(true);
    expect(cancelled.pages.every((page) => page.sizeBytes === undefined)).toBe(true);
  });
});
