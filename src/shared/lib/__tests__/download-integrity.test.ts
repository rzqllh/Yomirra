import { afterEach, describe, expect, it, vi } from "vitest";
import { processDownloadQueue } from "../download-engine";
import type { DownloadChapter } from "@/shared/store/download-store";

afterEach(() => vi.unstubAllGlobals());

describe("download cache integrity", () => {
  it("refetches an evicted cached page before marking a resumed chapter downloaded", async () => {
    const entries = new Map<string, Response>();
    vi.stubGlobal("caches", { open: async () => ({
      match: async (key: string) => entries.get(key),
      put: async (key: string, response: Response) => { entries.set(key, response); },
    }) });
    const fetch = vi.fn(async () => new Response("image", { headers: { "content-type": "image/jpeg" } }));
    vi.stubGlobal("fetch", fetch);
    const item: DownloadChapter = {
      id: "download", sourceId: "s", mangaId: "m", mangaTitle: "M", chapterId: "c", chapterTitle: "Chapter",
      status: "queued", progress: 50, downloadedPages: 1, totalPages: 2, createdAt: 1, updatedAt: 1,
      pages: [
        { index: 0, status: "cached", originalUrl: "/api/proxy/image?sig=a", offlineUrl: "/offline/0" },
        { index: 1, status: "pending", originalUrl: "/api/proxy/image?sig=b", offlineUrl: "/offline/1" },
      ],
    };
    let queue = [item.id];
    let active: string[] = [];
    await processDownloadQueue({
      getDownloads: () => ({ [item.id]: item }), getQueue: () => queue,
      getActiveDownloads: () => active, getMaxConcurrency: () => 1,
      setQueue: value => { queue = value; }, setActiveDownloads: value => { active = value; },
      updateDownload: (_, updates) => { Object.assign(item, updates); }, onProcessComplete: () => undefined,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(entries.size).toBe(2);
    expect(item.status).toBe("downloaded");
    expect(item.downloadedPages).toBe(2);
  });
});
