import { describe, expect, it, vi } from "vitest";
import {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  MANGA_IMAGES_CACHE_NAME,
  MANGA_METADATA_CACHE_NAME,
  PAGES_CACHE_NAME,
  READING_BUFFER_CACHE_NAME,
  cleanupOutdatedAppCaches,
  isOfflineCacheableNavigationPath,
  isOutdatedAppCacheName,
  isSessionSensitivePath,
} from "../pwa-cache-policy";

function createCacheStorage(cacheNames: string[]) {
  const names = new Set(cacheNames);
  return {
    keys: vi.fn(async () => Array.from(names)),
    delete: vi.fn(async (name: string) => names.delete(name)),
    has: (name: string) => names.has(name),
  };
}

describe("PWA cache policy", () => {
  it("keeps explicit downloads durable while automatic caches use the current version", () => {
    expect(EXPLICIT_DOWNLOADS_CACHE_NAME).toBe("yomirra-chapter-cache-v1");
    expect(READING_BUFFER_CACHE_NAME).toBe("yomirra-reading-buffer-v2");
    expect(MANGA_IMAGES_CACHE_NAME).toBe("yomirra-manga-images-v2");
    expect(MANGA_METADATA_CACHE_NAME).toBe("yomirra-manga-metadata-v2");
    expect(PAGES_CACHE_NAME).toBe("yomirra-pages-v2");
  });

  it("treats account, admin, and auth surfaces as session-sensitive without overmatching siblings", () => {
    expect(isSessionSensitivePath("/account")).toBe(true);
    expect(isSessionSensitivePath("/account/security")).toBe(true);
    expect(isSessionSensitivePath("/admin")).toBe(true);
    expect(isSessionSensitivePath("/api/admin/sources")).toBe(true);
    expect(isSessionSensitivePath("/api/auth/session")).toBe(true);

    expect(isSessionSensitivePath("/accounting")).toBe(false);
    expect(isSessionSensitivePath("/api/sources")).toBe(false);
  });

  it("only allows the intended offline navigation surface into the app page cache", () => {
    expect(isOfflineCacheableNavigationPath("/")).toBe(true);
    expect(isOfflineCacheableNavigationPath("/library")).toBe(true);
    expect(isOfflineCacheableNavigationPath("/manga/source/title/read/chapter")).toBe(true);
    expect(isOfflineCacheableNavigationPath("/account")).toBe(false);
    expect(isOfflineCacheableNavigationPath("/admin/overview")).toBe(false);
    expect(isOfflineCacheableNavigationPath("/unknown-private-route")).toBe(false);
  });

  it("migrates previous production runtime caches without deleting downloads or current caches", async () => {
    const cacheStorage = createCacheStorage([
      EXPLICIT_DOWNLOADS_CACHE_NAME,
      "yomirra-reading-buffer-v1",
      "yomirra-manga-images",
      "yomirra-manga-metadata",
      "yomirra-pages",
      READING_BUFFER_CACHE_NAME,
      MANGA_IMAGES_CACHE_NAME,
      MANGA_METADATA_CACHE_NAME,
      PAGES_CACHE_NAME,
      "serwist-precache-v1",
    ]);

    const deleted = await cleanupOutdatedAppCaches(cacheStorage);

    expect(deleted).toEqual(
      expect.arrayContaining([
        "yomirra-reading-buffer-v1",
        "yomirra-manga-images",
        "yomirra-manga-metadata",
        "yomirra-pages",
      ])
    );
    expect(cacheStorage.has(EXPLICIT_DOWNLOADS_CACHE_NAME)).toBe(true);
    expect(cacheStorage.has(READING_BUFFER_CACHE_NAME)).toBe(true);
    expect(cacheStorage.has(PAGES_CACHE_NAME)).toBe(true);
    expect(cacheStorage.has("serwist-precache-v1")).toBe(true);
  });

  it("classifies unknown old Yomirra cache versions as migratable but never the durable download cache", () => {
    expect(isOutdatedAppCacheName("yomirra-pages-v1")).toBe(true);
    expect(isOutdatedAppCacheName("yomirra-pages-v99")).toBe(true);
    expect(isOutdatedAppCacheName(EXPLICIT_DOWNLOADS_CACHE_NAME)).toBe(false);
    expect(isOutdatedAppCacheName("pages-rsc")).toBe(false);
  });
});
