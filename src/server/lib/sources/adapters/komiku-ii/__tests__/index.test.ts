import { describe, it, expect, vi, beforeEach } from "vitest";
import { KomikuIISource } from "../index";
import {
  buildKomikuIIChapterId,
  buildKomikuIIMangaId,
  normalizeKomikuIIStatus,
  parseKomikuIIChapterId,
  parseKomikuIIMangaId,
} from "../normalizer";
import type {
  KomikuIIChapterPagesResponse,
  KomikuIIComicsListResponse,
  KomikuIIDetail,
  KomikuIIFiltersResponse,
  KomikuIIItem,
} from "../types";

describe("KomikuIISource", () => {
  let source: KomikuIISource;

  beforeEach(() => {
    source = new KomikuIISource();
  });

  describe("Metadata and Capabilities", () => {
    it("has correct metadata and capabilities", () => {
      expect(source.id).toBe("komiku-ii");
      expect(source.name).toBe("Komiku II");
      expect(source.language).toBe("id");
      expect(source.baseUrl).toBe("https://01.komiku.asia");
      expect(source.upstreamDomain).toBe("01.komiku.asia");
      expect(source.isEnabled).toBe(true);
      expect(source.isInstalled).toBe(true);
      expect(source.status).toBe("online");
      expect(source.isNsfw).toBe(false);

      expect(source.capabilities).toEqual({
        popular: true,
        latest: true,
        search: true,
        detail: true,
        chapters: true,
        pages: true,
        filters: true,
      });
    });

    it("configures HttpClient with source-scoped allowedHosts", () => {
      const config = (source as any).client.getConfig();
      expect(config.baseUrl).toBe("https://01.komiku.asia/api/v2");
      expect(config.allowedHosts).toEqual(["01.komiku.asia"]);
      expect(config.timeoutMs).toBe(10000);
    });
  });

  describe("Compound Identity Helpers", () => {
    it("builds and parses compound mangaId", () => {
      const compoundId = buildKomikuIIMangaId(45959, "legend-of-star-general");
      expect(compoundId).toBe("45959::legend-of-star-general");

      const parsed = parseKomikuIIMangaId(compoundId);
      expect(parsed).toEqual({ comicId: 45959, slug: "legend-of-star-general" });

      // URL-encoded format from Next.js dynamic route params
      const encodedParsed = parseKomikuIIMangaId("45959%3A%3Alegend-of-star-general");
      expect(encodedParsed).toEqual({ comicId: 45959, slug: "legend-of-star-general" });
    });

    it("parses slug-only mangaId gracefully", () => {
      const parsed = parseKomikuIIMangaId("solo-leveling");
      expect(parsed).toEqual({ slug: "solo-leveling" });
    });

    it("parses numeric-only mangaId gracefully", () => {
      const parsed = parseKomikuIIMangaId("45959");
      expect(parsed).toEqual({ comicId: 45959, slug: "" });
    });

    it("throws on empty or invalid mangaId", () => {
      expect(() => parseKomikuIIMangaId("")).toThrow("INVALID_MANGA_ID");
      expect(() => parseKomikuIIMangaId(null as any)).toThrow("INVALID_MANGA_ID");
    });

    it("builds and parses compound chapterId", () => {
      const compoundId = buildKomikuIIChapterId(45959, 488541);
      expect(compoundId).toBe("45959::488541");

      const parsed = parseKomikuIIChapterId(compoundId);
      expect(parsed).toEqual({ comicId: 45959, chapterId: 488541 });

      // URL-encoded format from Next.js dynamic route params
      const encodedParsed = parseKomikuIIChapterId("45959%3A%3A488541");
      expect(encodedParsed).toEqual({ comicId: 45959, chapterId: 488541 });
    });

    it("throws on invalid chapterId format", () => {
      expect(() => parseKomikuIIChapterId("488541")).toThrow("INVALID_CHAPTER_ID");
      expect(() => parseKomikuIIChapterId("invalid::format::extra")).toThrow("INVALID_CHAPTER_ID");
      expect(() => parseKomikuIIChapterId("")).toThrow("INVALID_CHAPTER_ID");
    });

    it("normalizes status correctly", () => {
      expect(normalizeKomikuIIStatus("Ongoing")).toBe("ONGOING");
      expect(normalizeKomikuIIStatus("Berjalan")).toBe("ONGOING");
      expect(normalizeKomikuIIStatus("Completed")).toBe("COMPLETED");
      expect(normalizeKomikuIIStatus("Tamat")).toBe("COMPLETED");
      expect(normalizeKomikuIIStatus("Hiatus")).toBe("UNKNOWN");
      expect(normalizeKomikuIIStatus(undefined)).toBe("UNKNOWN");
    });
  });

  describe("Browse: getPopular & getLatest", () => {
    const mockList: KomikuIIComicsListResponse = {
      page: 1,
      perPage: 12,
      total: 100,
      totalPages: 9,
      items: [
        {
          id: 45959,
          slug: "legend-of-star-general",
          title: "Legend of Star General",
          alt: "Star Armor Soul",
          type: "Manhua",
          genres: ["Action", "Sci-Fi"],
          status: "Ongoing",
          author: "Author A",
          rating: 8,
          latestChapter: 392,
          updatedHoursAgo: 2,
          coverUrl: "https://content.komiku.me/cover1.jpg",
        },
      ],
    };

    it("normalizes popular comics with pagination", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue(mockList);

      const result = await source.getPopular(1);
      expect(result.mangas).toHaveLength(1);
      expect(result.hasNextPage).toBe(true);
      expect(result.mangas[0]).toEqual({
        id: "45959::legend-of-star-general",
        title: "Legend of Star General",
        coverUrl: "https://content.komiku.me/cover1.jpg",
        status: "ONGOING",
        format: "Manhua",
        latestChapter: "Chapter 392",
        latestChapterTime: "2 jam lalu",
        score: 8,
        originalTitle: "Star Armor Soul",
      });
    });

    it("normalizes latest comics correctly", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue({
        ...mockList,
        page: 9,
        totalPages: 9,
      });

      const result = await source.getLatest(9);
      expect(result.mangas).toHaveLength(1);
      expect(result.hasNextPage).toBe(false);
    });

    it("handles empty items list safely", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue({
        page: 1,
        perPage: 12,
        total: 0,
        totalPages: 0,
        items: [],
      });

      const result = await source.getPopular(1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });
  });

  describe("Search", () => {
    const mockSearchResults: KomikuIIItem[] = [
      {
        id: 100828,
        slug: "solo-leveling",
        title: "Solo Leveling",
        type: "Manhwa",
        status: "Completed",
        coverUrl: "https://content.komiku.me/solo.jpg",
        rating: 10,
        latestChapter: "179",
      },
    ];

    it("performs text search using /comics/search endpoint", async () => {
      const getSpy = vi.spyOn((source as any).client, "get").mockResolvedValue(mockSearchResults);

      const result = await source.search("solo", 1);
      expect(getSpy).toHaveBeenCalledWith("/comics/search", { q: "solo" });
      expect(result.mangas).toHaveLength(1);
      expect(result.mangas[0].id).toBe("100828::solo-leveling");
      expect(result.mangas[0].title).toBe("Solo Leveling");
      expect(result.hasNextPage).toBe(false);
    });

    it("returns empty results for page > 1 on text search without network call", async () => {
      const getSpy = vi.spyOn((source as any).client, "get");

      const result = await source.search("solo", 2);
      expect(getSpy).not.toHaveBeenCalled();
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it("handles empty search results gracefully", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue([]);

      const result = await source.search("nonexistentquery", 1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it("delegates to filtered comics browse when query is empty", async () => {
      const getSpy = vi.spyOn((source as any).client, "get").mockResolvedValue({
        page: 1,
        perPage: 12,
        total: 12,
        totalPages: 1,
        items: mockSearchResults,
      });

      const result = await source.search("", 1, { type: "Manhwa", status: "Ongoing" });
      expect(getSpy).toHaveBeenCalledWith("/comics", {
        page: 1,
        type: "Manhwa",
        status: "Ongoing",
      });
      expect(result.mangas).toHaveLength(1);
    });
  });

  describe("Detail", () => {
    const mockDetail: KomikuIIDetail = {
      id: 45959,
      slug: "legend-of-star-general",
      title: "Legend of Star General",
      alt: "Star Armor Soul",
      type: "Manhua",
      genres: ["Action", "Sci-Fi"],
      status: "Ongoing",
      author: "Author A",
      artist: "Artist B",
      synopsis: "<p>Song Yunxiang returns with 60 years of combat experience.</p>",
      rating: 8.5,
      coverUrl: "https://content.komiku.me/cover1.jpg",
    };

    it("parses detail using compound mangaId", async () => {
      const getSpy = vi.spyOn((source as any).client, "get").mockResolvedValue(mockDetail);

      const detail = await source.getDetail("45959::legend-of-star-general");
      expect(getSpy).toHaveBeenCalledWith("/comics/legend-of-star-general");
      expect(detail).toEqual({
        id: "45959::legend-of-star-general",
        title: "Legend of Star General",
        originalTitle: "Star Armor Soul",
        coverUrl: "https://content.komiku.me/cover1.jpg",
        description: "Song Yunxiang returns with 60 years of combat experience.",
        author: "Author A",
        artist: "Artist B",
        genres: ["Action", "Sci-Fi"],
        status: "ONGOING",
        format: "Manhua",
        score: 8.5,
        latestChapter: undefined,
        latestChapterTime: undefined,
      });
    });

    it("parses detail using slug-only mangaId", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue(mockDetail);

      const detail = await source.getDetail("legend-of-star-general");
      expect(detail.id).toBe("45959::legend-of-star-general");
    });

    it("throws when manga is not found", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue(null);

      await expect(source.getDetail("missing::not-found")).rejects.toThrow("Komiku II: Manga");
    });
  });

  describe("Chapters", () => {
    const mockChapters = [
      {
        id: 488541,
        n: 392,
        title: "Chapter 392",
        releasedLabel: "6 jam lalu",
      },
      {
        id: 488539,
        n: 391,
        title: "Chapter 391",
        releasedLabel: "1 hari lalu",
      },
    ];

    it("fetches chapters directly when comicId is present in compound mangaId", async () => {
      const getSpy = vi.spyOn((source as any).client, "get").mockResolvedValue(mockChapters);

      const chapters = await source.getChapters("45959::legend-of-star-general");
      expect(getSpy).toHaveBeenCalledWith("/comics/45959/chapters");
      expect(chapters).toHaveLength(2);
      expect(chapters[0]).toEqual({
        id: "45959::488541",
        mangaId: "45959::legend-of-star-general",
        number: 392,
        title: "Chapter 392",
        date: "6 jam lalu",
        isLocked: false,
      });
      expect(chapters[1].id).toBe("45959::488539");
      expect(chapters[1].number).toBe(391);
    });

    it("resolves detail first if only slug is provided in mangaId", async () => {
      const getSpy = vi.spyOn((source as any).client, "get");
      // First call is getDetail
      getSpy.mockResolvedValueOnce({
        id: 45959,
        slug: "legend-of-star-general",
        title: "Legend of Star General",
        coverUrl: "",
      });
      // Second call is getChapters
      getSpy.mockResolvedValueOnce(mockChapters);

      const chapters = await source.getChapters("legend-of-star-general");
      expect(getSpy).toHaveBeenNthCalledWith(1, "/comics/legend-of-star-general");
      expect(getSpy).toHaveBeenNthCalledWith(2, "/comics/45959/chapters");
      expect(chapters).toHaveLength(2);
      expect(chapters[0].id).toBe("45959::488541");
    });
  });

  describe("Pages", () => {
    const mockPages: KomikuIIChapterPagesResponse = {
      id: 488541,
      comicId: 45959,
      n: 392,
      title: "Chapter 392",
      pages: [
        { index: 0, url: "https://cdnkomiku.xyz/page0.webp" },
        { index: 1, url: "https://cdnkomiku.xyz/page1.webp" },
      ],
    };

    it("fetches and normalizes chapter pages", async () => {
      const getSpy = vi.spyOn((source as any).client, "get").mockResolvedValue(mockPages);

      const pages = await source.getPages("45959::488541");
      expect(getSpy).toHaveBeenCalledWith("/comics/45959/chapters/id/488541");
      expect(pages.chapterId).toBe("45959::488541");
      expect(pages.pages).toEqual([
        { index: 0, url: "https://cdnkomiku.xyz/page0.webp", referer: "https://01.komiku.asia/" },
        { index: 1, url: "https://cdnkomiku.xyz/page1.webp", referer: "https://01.komiku.asia/" },
      ]);
    });

    it("throws when chapterId format is invalid", async () => {
      await expect(source.getPages("raw_id")).rejects.toThrow("INVALID_CHAPTER_ID");
    });

    it("throws when pages array is missing or empty", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue({
        id: 488541,
        comicId: 45959,
        pages: null as any,
      });

      await expect(source.getPages("45959::488541")).rejects.toThrow("Komiku II: No pages found");
    });
  });

  describe("Filters", () => {
    const mockFilters: KomikuIIFiltersResponse = {
      genres: ["Action", "Comedy", "Fantasy"],
      statuses: ["Semua", "Ongoing", "Completed"],
      types: ["Semua", "Manhwa", "Manhua", "Manga"],
    };

    it("maps filter categories and strips 'Semua' option", async () => {
      vi.spyOn((source as any).client, "get").mockResolvedValue(mockFilters);

      const filters = await source.getFilters();
      expect(filters.genres).toEqual([
        { id: "Action", name: "Action" },
        { id: "Comedy", name: "Comedy" },
        { id: "Fantasy", name: "Fantasy" },
      ]);
      expect(filters.statuses).toEqual([
        { id: "Ongoing", name: "Ongoing" },
        { id: "Completed", name: "Completed" },
      ]);
      expect(filters.formats).toEqual([
        { id: "Manhwa", name: "Manhwa" },
        { id: "Manhua", name: "Manhua" },
        { id: "Manga", name: "Manga" },
      ]);
      expect(filters.sorts).toEqual([]);
    });

    it("returns resilient fallback filters if upstream endpoint fails", async () => {
      vi.spyOn((source as any).client, "get").mockRejectedValue(new Error("Network failure"));

      const filters = await source.getFilters();
      expect(filters.genres.length).toBeGreaterThan(0);
      expect(filters.statuses).toEqual([
        { id: "Ongoing", name: "Ongoing" },
        { id: "Completed", name: "Completed" },
      ]);
      expect(filters.formats).toEqual([
        { id: "Manhwa", name: "Manhwa" },
        { id: "Manhua", name: "Manhua" },
        { id: "Manga", name: "Manga" },
      ]);
    });
  });
});
