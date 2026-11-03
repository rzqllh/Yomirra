import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { contentCacheKey, getRequestReadOptions, loadSourceCatalog, loadSourcePages } from "../content-access";
import type { MangaSource } from "@/shared/sources/source-types";
import { withCache } from "@/server/lib/cache/redis-cache";

vi.mock("@/server/lib/cache/redis-cache", () => ({
  CACHE_TTL: { DISCOVERY: 1800, DETAIL: 86400, CHAPTERS: 1800, PAGES: 604800 },
  getSourceCacheKey: (source: MangaSource, operation: string, params: string) => `${source.id}:${operation}:${params}`,
  withCache: vi.fn((_key, fetcher) => fetcher()),
}));

function source(overrides: Partial<MangaSource> = {}): MangaSource {
  return { id: "test", name: "Test", isEnabled: true, isInstalled: true, isNsfw: false, isDynamic: false,
    capabilities: { popular: true, latest: true, search: true, detail: true, chapters: true, pages: true, filters: false },
    getPopular: vi.fn(async () => ({ mangas: [{ id: "safe", title: "Safe", coverUrl: "", contentRating: "safe" as const }, { id: "adult", title: "Adult", coverUrl: "", contentRating: "erotica" as const }, { id: "unknown", title: "Unknown", coverUrl: "", contentRating: "unknown" as const }, { id: "unclassified", title: "Unclassified", coverUrl: "" }], hasNextPage: false })),
    search: vi.fn(), getLatest: vi.fn(), getDetail: vi.fn(), getChapters: vi.fn(), getPages: vi.fn(async () => ({ chapterId: "c", pages: [] })), getFilters: vi.fn(), ...overrides };
}

describe("read request policy boundaries", () => {
  it("requires a persisted opt-in before URL params can reveal adult content", () => {
    expect(getRequestReadOptions(new NextRequest("http://localhost/api"))).toMatchObject({ hideNsfw: true });
    expect(getRequestReadOptions(new NextRequest("http://localhost/api?hideNsfw=false"))).toMatchObject({ hideNsfw: true });
    expect(getRequestReadOptions(new NextRequest("http://localhost/api?hideNsfw=false", { headers: { cookie: "yomirra-hide-nsfw=true" } }))).toMatchObject({ hideNsfw: true });
    expect(getRequestReadOptions(new NextRequest("http://localhost/api?hideNsfw=false", { headers: { cookie: "yomirra-hide-nsfw=false" } }))).toMatchObject({ hideNsfw: false });
    expect(getRequestReadOptions(new NextRequest("http://localhost/api", { headers: { cookie: "yomirra-hide-nsfw=false" } }))).toMatchObject({ hideNsfw: false });
    expect(getRequestReadOptions(new NextRequest("http://localhost/api?hideNsfw=true", { headers: { cookie: "yomirra-hide-nsfw=false" } }))).toMatchObject({ hideNsfw: true });
    expect(getRequestReadOptions(new NextRequest("http://localhost/api?hideNsfw=invalid", { headers: { cookie: "yomirra-hide-nsfw=false" } }))).toMatchObject({ hideNsfw: true });
  });
  it("does not fetch disabled or adult-only sources by default", async () => {
    const adult = source({ isNsfw: true });
    await expect(loadSourceCatalog(adult, "popular", 1)).rejects.toMatchObject({ code: "CONTENT_RESTRICTED" });
    expect(adult.getPopular).not.toHaveBeenCalled();
    await expect(loadSourceCatalog(source({ isEnabled: false }), "popular", 1)).rejects.toMatchObject({ code: "SOURCE_DISABLED" });
  });
  it("filters restricted catalog entries before returning them", async () => {
    expect((await loadSourceCatalog(source(), "popular", 1)).mangas.map((item) => item.id)).toEqual(["safe", "unknown", "unclassified"]);
  });
  it("separates opt-in, language and quality cache variants", () => {
    const item = source();
    const safe = contentCacheKey(item, "pages", "work:c");
    expect(contentCacheKey(item, "pages", "work:c", { hideNsfw: false })).not.toBe(safe);
    expect(contentCacheKey(item, "pages", "work:c", { preferredLanguages: ["en"] })).not.toBe(safe);
    expect(contentCacheKey(item, "pages", "work:c", { dataSaver: true })).not.toBe(safe);
  });
  it("never revives stale MangaDex image URLs and passes the expected parent identity", async () => {
    const item = source({ id: "mangadex" });
    await loadSourcePages(item, "work", "c");
    expect(withCache).toHaveBeenLastCalledWith(expect.any(String), expect.any(Function), 300, { allowStaleOnError: false });
    expect(item.getPages).toHaveBeenCalledWith("c", { mangaId: "work" });
  });
});
