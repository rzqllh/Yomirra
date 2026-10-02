import { describe, expect, it, vi } from "vitest";
import { deleteDownloadCacheEntries } from "../download-cache";
import { EXPLICIT_DOWNLOADS_CACHE_NAME } from "../pwa-cache-policy";

describe("download cache cleanup", () => {
  it("deletes only entries belonging to the cancelled download", async () => {
    const deleteMock = vi.fn(async () => true);
    const cache = {
      keys: vi.fn(async () => [
        new Request("https://app.test/offline-images/src::manga::ch-1/0"),
        new Request("https://app.test/offline-images/src::manga::ch-1/1"),
        new Request("https://app.test/offline-images/src::manga::ch-2/0"),
      ]),
      delete: deleteMock,
    };
    const cacheStorage = {
      open: vi.fn(async (name: string) => {
        expect(name).toBe(EXPLICIT_DOWNLOADS_CACHE_NAME);
        return cache;
      }),
    };

    const deleted = await deleteDownloadCacheEntries(
      "src::manga::ch-1",
      cacheStorage as unknown as CacheStorage
    );

    expect(deleted).toBe(2);
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(
      deleteMock.mock.calls.every(([request]) =>
        (request as Request).url.includes("/offline-images/src::manga::ch-1/")
      )
    ).toBe(true);
  });
});
