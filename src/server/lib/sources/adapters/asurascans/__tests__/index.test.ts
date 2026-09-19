import { describe, it, expect, vi, beforeEach } from "vitest";
import { AsuraScansSource } from "../index";
import { HttpClient } from "../../base/http-client";
import {
  mockAsuraChapters,
  mockAsuraGenres,
  mockAsuraLockedPages,
  mockAsuraSeriesDetail,
  mockAsuraSeriesList,
  mockAsuraUnlockedPages,
} from "./fixtures";
import {
  buildAsuraChapterId,
  normalizeAsuraChapter,
  normalizeAsuraMangaDetail,
  normalizeAsuraMangaItem,
  normalizeAsuraPages,
  normalizeAsuraStatus,
  parseAsuraChapterId,
  stripHtml,
} from "../normalizer";

describe("AsuraScansSource Adapter", () => {
  let adapter: AsuraScansSource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    getText: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      getText: vi.fn(),
    };
    adapter = new AsuraScansSource(mockHttpClient as unknown as HttpClient);
  });

  describe("Metadata & Capabilities", () => {
    it("exports correct metadata conforming to SourceMetadata contract", () => {
      expect(adapter.id).toBe("asurascans");
      expect(adapter.name).toBe("Asura Scans");
      expect(adapter.language).toBe("en");
      expect(adapter.upstreamDomain).toBe("api.asurascans.com");
      expect(adapter.baseUrl).toBe("https://api.asurascans.com/api");
      expect(adapter.isEnabled).toBe(true);
      expect(adapter.isInstalled).toBe(true);
      expect(adapter.isNsfw).toBe(false);
      expect(adapter.capabilities.popular).toBe(true);
      expect(adapter.capabilities.latest).toBe(true);
      expect(adapter.capabilities.search).toBe(true);
      expect(adapter.capabilities.detail).toBe(true);
      expect(adapter.capabilities.chapters).toBe(true);
      expect(adapter.capabilities.pages).toBe(true);
      expect(adapter.capabilities.filters).toBe(true);
    });
  });

  describe("Normalizer Units", () => {
    it("stripHtml cleanly removes HTML tags and decodes entities", () => {
      const dirty = "<p>Warriors &amp; heroes gather.</p><p>Defeat means &quot;death&quot;.</p>";
      const clean = stripHtml(dirty);
      expect(clean).toBe('Warriors & heroes gather.\n\nDefeat means "death".');
    });

    it("normalizeAsuraStatus maps statuses accurately", () => {
      expect(normalizeAsuraStatus("ongoing")).toBe("ONGOING");
      expect(normalizeAsuraStatus("completed")).toBe("COMPLETED");
      expect(normalizeAsuraStatus("hiatus")).toBe("ONGOING");
      expect(normalizeAsuraStatus("dropped")).toBe("CANCELLED");
      expect(normalizeAsuraStatus(undefined)).toBe("UNKNOWN");
    });

    it("normalizeAsuraMangaItem maps series item correctly", () => {
      const item = normalizeAsuraMangaItem(mockAsuraSeriesList.data[0]);
      expect(item.id).toBe("war-of-extinction");
      expect(item.title).toBe("War of Extinction");
      expect(item.coverUrl).toContain("war-of-extinction.f60b25.webp");
      expect(item.status).toBe("ONGOING");
      expect(item.format).toBe("MANHWA");
      expect(item.latestChapter).toBe("Chapter 7");
      expect(item.rank).toBe(140);
      expect(item.score).toBe(8.6);
      expect(item.description).toContain("Heavenly Demons");
    });

    it("normalizeAsuraMangaDetail formats full detail", () => {
      const detail = normalizeAsuraMangaDetail(mockAsuraSeriesDetail.series);
      expect(detail.id).toBe("war-of-extinction");
      expect(detail.genres).toEqual(["Action", "Adventure", "Fantasy"]);
      expect(detail.description).toBe("Heavenly Demons. Hunters. Giant robots.\n\nWith video-game powers & abilities.");
      expect(detail.status).toBe("ONGOING");
    });

    it("buildAsuraChapterId & parseAsuraChapterId handle regular and URL-encoded ids", () => {
      const chId = buildAsuraChapterId("war-of-extinction", "chapter-7");
      expect(chId).toBe("war-of-extinction::chapter-7");

      const parsed = parseAsuraChapterId(chId);
      expect(parsed.seriesSlug).toBe("war-of-extinction");
      expect(parsed.chapterParam).toBe("chapter-7");

      // Test URL-encoded
      const parsedEncoded = parseAsuraChapterId("war-of-extinction%3A%3Achapter-7");
      expect(parsedEncoded.seriesSlug).toBe("war-of-extinction");
      expect(parsedEncoded.chapterParam).toBe("chapter-7");
    });

    it("normalizeAsuraChapter flags locked chapters correctly", () => {
      // Unlocked
      const unlocked = normalizeAsuraChapter(mockAsuraChapters.data[0], "war-of-extinction");
      expect(unlocked.id).toBe("war-of-extinction::chapter-7");
      expect(unlocked.number).toBe(7);
      expect(unlocked.title).toBe("Chapter 7");
      expect(unlocked.isLocked).toBe(false);

      // Locked via is_locked / is_premium / early_access_until
      const locked = normalizeAsuraChapter(mockAsuraChapters.data[2], "war-of-extinction");
      expect(locked.id).toBe("war-of-extinction::chapter-8");
      expect(locked.number).toBe(8);
      expect(locked.isLocked).toBe(true);
    });

    it("normalizeAsuraPages enforces locked boundary and maps dimensions", () => {
      // Unlocked
      const unlockedPages = normalizeAsuraPages(mockAsuraUnlockedPages, "war-of-extinction::chapter-7");
      expect(unlockedPages.pages).toHaveLength(2);
      expect(unlockedPages.pages[0].width).toBe(1532);
      expect(unlockedPages.pages[0].height).toBe(1024);

      // Locked: MUST return empty pages array without failing
      const lockedPages = normalizeAsuraPages(mockAsuraLockedPages, "war-of-extinction::chapter-8");
      expect(lockedPages.pages).toEqual([]);
    });
  });

  describe("Browse & Search", () => {
    it("getPopular fetches series ordered by popular", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraSeriesList);

      const res = await adapter.getPopular(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/series", {
        page: 1,
        order: "popular",
      });
      expect(res.mangas).toHaveLength(2);
      expect(res.hasNextPage).toBe(true);
      expect(res.mangas[0].title).toBe("War of Extinction");
    });

    it("getLatest fetches series ordered by update", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraSeriesList);

      const res = await adapter.getLatest(2);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/series", {
        page: 2,
        order: "update",
      });
      expect(res.mangas).toHaveLength(2);
    });

    it("search queries series with text and filters", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraSeriesList);

      const res = await adapter.search("sword", 1, {
        genres: "action",
        status: "ongoing",
        type: "manhwa",
        sort: "popular",
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith("/series", {
        page: 1,
        search: "sword",
        genres: "action",
        status: "ongoing",
        type: "manhwa",
        order: "popular",
      });
      expect(res.mangas).toHaveLength(2);
    });

    it("search with empty query returns results without search param", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraSeriesList);

      await adapter.search("", 1);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/series", {
        page: 1,
      });
    });

    it("handles empty browse result gracefully", async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [], meta: { has_more: false } });

      const res = await adapter.getPopular(999);
      expect(res.mangas).toEqual([]);
      expect(res.hasNextPage).toBe(false);
    });
  });

  describe("Detail & Chapters", () => {
    it("getDetail retrieves series detail and normalizes metadata", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraSeriesDetail);

      const detail = await adapter.getDetail("war-of-extinction");
      expect(mockHttpClient.get).toHaveBeenCalledWith("/series/war-of-extinction");
      expect(detail.title).toBe("War of Extinction");
      expect(detail.genres).toContain("Action");
    });

    it("getDetail throws for missing manga", async () => {
      mockHttpClient.get.mockResolvedValueOnce({ series: null });

      await expect(adapter.getDetail("non-existent")).rejects.toThrow(
        /Manga "non-existent" not found/
      );
    });

    it("getDetail rejects empty mangaId", async () => {
      await expect(adapter.getDetail("")).rejects.toThrow(/INVALID_MANGA_ID/);
    });

    it("getChapters retrieves chapters list", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraChapters);

      const chapters = await adapter.getChapters("war-of-extinction");
      expect(mockHttpClient.get).toHaveBeenCalledWith("/series/war-of-extinction/chapters");
      expect(chapters).toHaveLength(3);
      expect(chapters[0].title).toBe("Chapter 7");
      expect(chapters[2].isLocked).toBe(true);
    });

    it("getChapters returns empty array if response is empty", async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: null });

      const chapters = await adapter.getChapters("war-of-extinction");
      expect(chapters).toEqual([]);
    });
  });

  describe("Pages & Locked Content Boundary", () => {
    it("getPages retrieves readable pages for unlocked chapter", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraUnlockedPages);

      const pages = await adapter.getPages("war-of-extinction::chapter-7");
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        "/series/war-of-extinction/chapters/chapter-7"
      );
      expect(pages.pages).toHaveLength(2);
      expect(pages.pages[0].url).toContain("001.webp");
      expect(pages.pages[0].width).toBe(1532);
      expect(pages.pages[0].height).toBe(1024);
    });

    it("CRITICAL: getPages for locked chapter returns empty pages array without attempting bypass", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraLockedPages);

      const pages = await adapter.getPages("war-of-extinction::chapter-8");
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        "/series/war-of-extinction/chapters/chapter-8"
      );
      // Locked boundary enforced: no bypass, no fabricated URLs, empty pages
      expect(pages.pages).toEqual([]);
    });

    it("getPages throws on invalid chapter ID format", async () => {
      await expect(adapter.getPages("invalid-id-without-delimiter")).rejects.toThrow(
        /INVALID_CHAPTER_ID/
      );
    });

    it("getPages handles unlocked chapter with missing pages safely", async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          is_locked: false,
          chapter: { pages: null },
        },
      });

      const pages = await adapter.getPages("war-of-extinction::chapter-1");
      expect(pages.pages).toEqual([]);
    });
  });

  describe("Filters", () => {
    it("getFilters returns genres and static categories", async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockAsuraGenres);

      const filters = await adapter.getFilters();
      expect(mockHttpClient.get).toHaveBeenCalledWith("/genres");
      expect(filters.genres).toHaveLength(3);
      expect(filters.genres[0]).toEqual({ id: "action", name: "Action" });
      expect(filters.formats.length).toBeGreaterThan(0);
      expect(filters.statuses.length).toBeGreaterThan(0);
      expect(filters.sorts.length).toBeGreaterThan(0);
    });

    it("getFilters handles API error gracefully with fallback", async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error("Network failure"));

      const filters = await adapter.getFilters();
      expect(filters.genres).toEqual([]);
      expect(filters.formats.length).toBeGreaterThan(0);
    });
  });
});
