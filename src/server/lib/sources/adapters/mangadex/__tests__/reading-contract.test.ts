import { describe, expect, it, vi } from "vitest";
import { MangaDexSource, type mdFetch } from "../index";
import type { MangaDexChapter, MangaDexManga } from "../types";

const manga = (rating: MangaDexManga["attributes"]["contentRating"] = "safe"): MangaDexManga => ({
  id: "work", type: "manga", relationships: [],
  attributes: { title: { en: "Work" }, altTitles: [], description: {}, status: "ongoing", year: null,
    contentRating: rating, tags: [], originalLanguage: "ja", publicationDemographic: null, lastChapter: null, lastVolume: null },
});

const chapter = (id: string, number: string | null = "1", language = "id", volume = "1"): MangaDexChapter => ({
  id, type: "chapter", relationships: [{ id: "work", type: "manga" }],
  attributes: { title: number === null ? `Special ${id}` : null, chapter: number, volume, translatedLanguage: language,
    publishAt: "2026-01-01", readableAt: "2026-01-01", pages: 2 },
});

function sourceWith(data: MangaDexChapter[] = [], rating: MangaDexManga["attributes"]["contentRating"] = "safe") {
  const request = vi.fn(async (path: string, params?: Record<string, string | string[]>) => {
    if (path === "/manga/work") return { data: manga(rating) };
    if (path === "/manga") return { data: [manga("safe"), manga("erotica")], total: 2 };
    if (path.endsWith("/feed")) {
      const offset = Number(params?.offset ?? 0);
      return { data: data.slice(offset, offset + 2), total: data.length };
    }
    if (path.startsWith("/chapter/")) return { data: data.find((item) => path.endsWith(item.id)) ?? chapter("c") };
    if (path.startsWith("/at-home/")) return { baseUrl: "https://uploads.mangadex.org", chapter: { hash: "hash", data: ["1.png", "2.png"], dataSaver: ["1.jpg", "2.jpg"] } };
    throw new Error(`Unexpected request ${path}`);
  });
  return { source: new MangaDexSource(request as typeof mdFetch), request };
}

describe("MangaDex safe catalog and actual reading contract", () => {
  it("requests only safe ratings by default and filters a restricted upstream result", async () => {
    const { source, request } = sourceWith();
    expect(source.isNsfw).toBe(false);
    expect((await source.getPopular(1)).mangas).toHaveLength(1);
    expect(request.mock.calls[0][1]?.["contentRating[]"]).toEqual(["safe"]);
    expect((await source.getLatest(1)).mangas[0].contentRating).toBe("safe");
    expect((await source.search("work", 1)).mangas).toHaveLength(1);
  });

  it("keeps explicit opt-in in request scope without changing the shared adapter", async () => {
    const { source } = sourceWith();
    expect((await source.getPopular(1, { hideNsfw: false })).mangas).toHaveLength(2);
    expect((await source.getPopular(1)).mangas).toHaveLength(1);
  });

  it("blocks restricted detail and chapters before exposing chapter metadata", async () => {
    const { source, request } = sourceWith([chapter("c")], "erotica");
    await expect(source.getDetail("work")).rejects.toMatchObject({ code: "CONTENT_RESTRICTED" });
    await expect(source.getChapters("work")).rejects.toMatchObject({ code: "CONTENT_RESTRICTED" });
    expect(request.mock.calls.some(([path]) => path.endsWith("/feed"))).toBe(false);
  });

  it("paginates short feed pages and prefers the requested language within the same volume", async () => {
    const { source } = sourceWith([chapter("en", "1", "en"), chapter("id"), chapter("two", "2")]);
    expect((await source.getChapters("work")).map((item) => item.id)).toEqual(["two", "id"]);
    expect((await source.getChapters("work", { preferredLanguages: ["en", "id"] })).map((item) => item.id)).toEqual(["two", "en"]);
  });

  it("does not merge equal chapter numbers from different volumes or unnumbered specials", async () => {
    const { source } = sourceWith([chapter("v1"), chapter("v2", "1", "id", "2"), chapter("s1", null), chapter("s2", null)]);
    const result = await source.getChapters("work");
    expect(result.map((item) => item.id)).toEqual(expect.arrayContaining(["v1", "v2", "s1", "s2"]));
    expect(result).toHaveLength(4);
  });

  it("reports external-only chapters as unavailable instead of fabricating pages", async () => {
    const external = chapter("external"); external.attributes.externalUrl = "https://publisher.example/chapter";
    const { source, request } = sourceWith([external]);
    await expect(source.getChapters("work")).rejects.toMatchObject({ code: "CHAPTER_UNAVAILABLE" });
    await expect(source.getPages("external", { mangaId: "work" })).rejects.toMatchObject({ code: "CHAPTER_UNAVAILABLE" });
    expect(request.mock.calls.some(([path]) => path.startsWith("/at-home"))).toBe(false);
  });

  it("checks chapter parent identity before requesting images", async () => {
    const { source, request } = sourceWith([chapter("c")]);
    await expect(source.getPages("c", { mangaId: "other" })).rejects.toMatchObject({ code: "MAPPING_UNAVAILABLE" });
    expect(request.mock.calls.some(([path]) => path.startsWith("/at-home"))).toBe(false);
  });

  it("retrieves ordered at-home images and honors data saver without changing identity", async () => {
    const { source } = sourceWith([chapter("c")]);
    const normal = await source.getPages("c", { mangaId: "work" });
    const saver = await source.getPages("c", { mangaId: "work", dataSaver: true });
    expect(normal.pages.map((page) => page.url)).toEqual(["https://uploads.mangadex.org/data/hash/1.png", "https://uploads.mangadex.org/data/hash/2.png"]);
    expect(saver.pages[0].url).toBe("https://uploads.mangadex.org/data-saver/hash/1.jpg");
  });

  it("stops non-advancing pagination rather than returning an incomplete successful list", async () => {
    const { source, request } = sourceWith();
    request.mockImplementation(async (path) => path.endsWith("/feed") ? { data: [chapter("repeat")], total: 10 } : { data: manga() } as never);
    await expect(source.getChapters("work")).rejects.toMatchObject({ code: "SCHEMA_CHANGED" });
  });
});
