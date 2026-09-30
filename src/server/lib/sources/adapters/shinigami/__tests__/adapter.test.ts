import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShinigamiSource } from "../index";
import { HttpClient } from "../../base/http-client";

function makeAdapter() {
  const mockClient = {
    get: vi.fn(),
    getBaseUrl: vi.fn().mockReturnValue("https://api.shngm.io"),
    setBaseUrl: vi.fn(),
    getConfig: vi.fn(),
  } as unknown as HttpClient;
  const source = new ShinigamiSource(undefined, mockClient);
  return { source, get: mockClient.get as ReturnType<typeof vi.fn> };
}

describe("ShinigamiSource — reliability hardening", () => {
  describe("getPopular", () => {
    it("returns empty list when API data is null", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: null, meta: {} });
      const result = await source.getPopular(1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it("returns empty list when API response is empty object", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({});
      const result = await source.getPopular(1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it("maps valid data and hasNextPage correctly", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({
        data: [{ manga_id: "test", title: "Test", cover_image_url: "https://x.com/c.jpg", status: 1 }],
        meta: { page: 1, total_page: 3 },
      });
      const result = await source.getPopular(1);
      expect(result.mangas).toHaveLength(1);
      expect(result.mangas[0].id).toBe("test");
      expect(result.hasNextPage).toBe(true);
    });
  });

  describe("getLatest", () => {
    it("returns empty list when data is not an array", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: "not-array", meta: {} });
      const result = await source.getLatest(1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });
  });

  describe("getChapters", () => {
    it("returns empty array when response data is null", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: null });
      const result = await source.getChapters("manga-id");
      expect(result).toEqual([]);
    });

    it("maps chapters correctly", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({
        data: [{ chapter_id: "ch-1", chapter_number: 1, chapter_title: "Chapter 1", release_date: "2024-01-01" }],
      });
      const chapters = await source.getChapters("manga-id");
      expect(chapters).toHaveLength(1);
      expect(chapters[0].id).toBe("ch-1");
      expect(chapters[0].mangaId).toBe("manga-id");
    });
  });

  describe("getPages", () => {
    it("returns empty pages when chapter.data is null", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({
        data: { base_url: "https://cdn.x.com", chapter: { path: "/ch1/", data: null } },
      });
      const result = await source.getPages("ch-1");
      expect(result.pages).toEqual([]);
      expect(result.chapterId).toBe("ch-1");
    });

    it("returns empty pages when response data is missing", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({});
      const result = await source.getPages("ch-1");
      expect(result.pages).toEqual([]);
      expect(result.chapterId).toBe("ch-1");
    });

    it("builds correct page URLs", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({
        data: {
          base_url: "https://cdn.x.com",
          chapter: { path: "/vol1/ch1/", data: ["001.jpg", "002.jpg"] },
          prev_chapter_id: null,
          next_chapter_id: "ch-2",
        },
      });
      const result = await source.getPages("ch-1");
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].url).toBe("https://cdn.x.com/vol1/ch1/001.jpg");
      expect(result.pages[1].url).toBe("https://cdn.x.com/vol1/ch1/002.jpg");
      expect(result.pages[0].referer).toBe("https://c.shinigami.asia");
      expect(result.pages[0].index).toBe(0);
    });
  });
});