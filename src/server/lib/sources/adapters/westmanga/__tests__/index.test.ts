import { describe, it, expect, vi, beforeEach } from "vitest";
import { WestMangaSource } from "../index";
import { generateWestMangaSignature, getWestMangaHeaders, WESTMANGA_DEFAULT_KEY, WESTMANGA_SALT } from "../crypto";
import { HttpClient } from "../../base/http-client";
import { sourceRegistry } from "@/shared/sources/source-registry";

describe("WestMangaSource", () => {
  let source: WestMangaSource;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient({
      baseUrl: "https://data.mantweh.online",
      timeoutMs: 5000,
    });
    source = new WestMangaSource(mockHttpClient);
  });

  describe("Metadata & Capabilities", () => {
    it("has correct identification and default settings", () => {
      expect(source.id).toBe("westmanga");
      expect(source.name).toBe("WestManga");
      expect(source.isNsfw).toBe(false);
      expect(source.isEnabled).toBe(true);
      expect(source.status).toBe("online");
      expect(source.upstreamDomain).toBe("data.mantweh.online");
      expect(source.language).toBe("id");
    });

    it("declares reading capabilities without advertising unsupported provider filters", () => {
      expect(source.capabilities.popular).toBe(true);
      expect(source.capabilities.latest).toBe(true);
      expect(source.capabilities.search).toBe(true);
      expect(source.capabilities.detail).toBe(true);
      expect(source.capabilities.chapters).toBe(true);
      expect(source.capabilities.pages).toBe(true);
      expect(source.capabilities.filters).toBe(false);
    });

    it("is registered in sourceRegistry with isNsfw=false and isEnabled=true", () => {
      const entry = sourceRegistry.find((s) => s.id === "westmanga");
      expect(entry).toBeDefined();
      expect(entry?.isNsfw).toBe(false);
      expect(entry?.isEnabled).toBe(true);
      expect(entry?.name).toBe("WestManga");
    });
  });

  describe("Crypto & Signature", () => {
    it("generates HMAC-SHA256 signature stripping query parameters", () => {
      const timestamp = 1790780000;
      const sigWithQuery = generateWestMangaSignature("/api/contents?page=1", timestamp, "GET");
      const sigWithoutQuery = generateWestMangaSignature("/api/contents", timestamp, "GET");

      expect(sigWithQuery).toBe(sigWithoutQuery);
      expect(sigWithQuery).toHaveLength(64); // SHA-256 hex string length
    });

    it("generates correct request headers", () => {
      const headers = getWestMangaHeaders("/api/contents");
      expect(headers["x-wm-request-time"]).toBeDefined();
      expect(headers["x-wm-request-signature"]).toHaveLength(64);
      expect(headers["x-wm-accses-key"]).toBe(WESTMANGA_DEFAULT_KEY);
      expect(headers.Referer).toBe("https://v1.westmanga.my/");
      expect(headers.Origin).toBe("https://v1.westmanga.my");
    });
  });

  describe("Methods & Normalization", () => {
    it("getPopular normalizes items and calculates pagination", async () => {
      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce({
        data: [
          {
            id: 12345,
            title: "Test Manga",
            slug: "test-manga",
            cover: "https://storage.westmanga.blog/covers/test.webp",
            status: "ongoing",
            rating: 8.5,
          },
        ],
      });

      const res = await source.getPopular(1);
      expect(res.mangas).toHaveLength(1);
      expect(res.mangas[0]).toEqual({
        id: "test-manga",
        title: "Test Manga",
        coverUrl: "https://storage.westmanga.blog/covers/test.webp",
        status: "ONGOING",
        score: 8.5,
      });
      expect(res.hasNextPage).toBe(false);
    });

    it("search sends query and returns results", async () => {
      const getSpy = vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce({
        data: [
          {
            id: 999,
            title: "Dragon Slayer",
            slug: "dragon-slayer",
            cover: "https://storage.westmanga.blog/covers/dragon.webp",
            status: "completed",
          },
        ],
      });

      const res = await source.search("dragon", 1);
      expect(getSpy).toHaveBeenCalledWith(
        "/api/contents",
        { page: 1, q: "dragon" },
        expect.any(Object)
      );
      expect(res.mangas[0].status).toBe("COMPLETED");
    });

    it("getDetail maps manga info and genres", async () => {
      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce({
        data: {
          id: 100,
          title: "My Dragon Girl",
          slug: "my-dragon-girl",
          cover: "https://storage.westmanga.blog/covers/girl.webp",
          sinopsis: "A great dragon story.",
          author: "Artist A",
          status: "publishing",
          genres: [{ id: 1, name: "Action" }, { id: 2, name: "Fantasy" }],
          chapters: [
            {
              id: 1001,
              number: "01",
              slug: "my-dragon-girl-chapter-01",
              created_at: { formatted: "2026-09-30" },
            },
          ],
        },
      });

      const detail = await source.getDetail("my-dragon-girl");
      expect(detail.id).toBe("my-dragon-girl");
      expect(detail.title).toBe("My Dragon Girl");
      expect(detail.description).toBe("A great dragon story.");
      expect(detail.genres).toEqual(["Action", "Fantasy"]);
      expect(detail.status).toBe("ONGOING"); // publishing maps to ONGOING
      expect(detail.author).toBe("Artist A");
    });

    it("getChapters maps chapter items correctly", async () => {
      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce({
        data: {
          id: 100,
          slug: "my-dragon-girl",
          chapters: [
            {
              id: 201,
              number: "12.5",
              slug: "my-dragon-girl-chapter-12-5",
              updated_at: { formatted: "12 Oct 2026" },
            },
          ],
        },
      });

      const chapters = await source.getChapters("my-dragon-girl");
      expect(chapters).toHaveLength(1);
      expect(chapters[0]).toEqual({
        id: "my-dragon-girl-chapter-12-5",
        mangaId: "my-dragon-girl",
        number: 12.5,
        title: "Chapter 12.5",
        date: "12 Oct 2026",
      });
    });

    it("getPages extracts reader images", async () => {
      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce({
        data: {
          id: 201,
          slug: "my-dragon-girl-chapter-12-5",
          images: [
            "https://storage.westmanga.blog/img1.webp",
            "https://storage.westmanga.blog/img2.webp",
          ],
        },
      });

      const res = await source.getPages("my-dragon-girl-chapter-12-5");
      expect(res.chapterId).toBe("my-dragon-girl-chapter-12-5");
      expect(res.pages).toHaveLength(2);
      expect(res.pages[0]).toEqual({
        index: 0,
        url: "https://storage.westmanga.blog/img1.webp",
        referer: "https://v1.westmanga.my/",
      });
      expect(res.pages[1].index).toBe(1);
    });
  });
});
