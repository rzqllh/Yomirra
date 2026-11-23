import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShinigamiSource } from "../index";
import { HttpClient } from "../../base/http-client";

function makeAdapter() {
  const mockClient = {
    get: vi.fn(),
    getBaseUrl: vi.fn().mockReturnValue("https://api.shinigami.io"),
    setBaseUrl: vi.fn(),
    getConfig: vi.fn(),
  } as unknown as HttpClient;
  const source = new ShinigamiSource(undefined, mockClient);
  return { source, get: mockClient.get as ReturnType<typeof vi.fn> };
}

describe("ShinigamiSource — reliability hardening", () => {
  describe("getPopular", () => {
    it("uses the updated host and offset/limit contract", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: [], meta: { has_next: false } });
      await source.getPopular(2);
      expect(source.upstreamDomain).toBe("api.shinigami.io");
      expect(get).toHaveBeenCalledWith("/v1/manga/list", {
        offset: 24, limit: 24, sort: "popularity",
      });
    });

    it("understands cursor metadata instead of legacy page counters", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: [], meta: { has_next: true, next_cursor: "abc" } });
      expect((await source.getPopular(1)).hasNextPage).toBe(true);
    });

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

    it("retrieves all cursor-based chapter pages and stops after has_next=false", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValueOnce({
        data: [{ chapter_id: "a", chapter_number: 1, chapter_title: "One", release_date: "2026-11-01" }],
        meta: { has_next: true, next_cursor: "next-a" },
      }).mockResolvedValueOnce({
        data: [{ chapter_id: "b", chapter_number: 2, chapter_title: "Two", release_date: "2026-11-02" }],
        meta: { has_next: false, next_cursor: null },
      });
      const chapters = await source.getChapters("series");
      expect(chapters.map(ch => ch.id)).toEqual(["a", "b"]);
      expect(get).toHaveBeenNthCalledWith(1, "/v1/chapter/series/list", undefined);
      expect(get).toHaveBeenNthCalledWith(2, "/v1/chapter/series/list", { cursor: "next-a" });
    });

    it("rejects repeated upstream cursors instead of looping indefinitely", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: [], meta: { has_next: true, next_cursor: "loop" } });
      await expect(source.getChapters("series")).rejects.toThrow(/cursor/);
      expect(get).toHaveBeenCalledTimes(2);
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

  describe("search", () => {
    it("returns empty list when search response data is null", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: null, meta: {} });
      const result = await source.search("solo leveling", 1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it("returns empty list when search response is empty object", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({});
      const result = await source.search("test", 1);
      expect(result.mangas).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it("maps search results properly", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({
        data: [{ manga_id: "m-1", title: "Manga 1", cover_image_url: "https://c.jpg", status: 1 }],
        meta: { page: 1, total_page: 2 },
      });
      const result = await source.search("manga", 1);
      expect(result.mangas).toHaveLength(1);
      expect(result.mangas[0].id).toBe("m-1");
      expect(result.hasNextPage).toBe(true);
    });
  });

  describe("getDetail", () => {
    it("throws when detail response has no data", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({});
      await expect(source.getDetail("invalid-id")).rejects.toThrow(
        "Shinigami detail returned empty response for invalid-id"
      );
    });

    it("keeps requested ID when the new detail response omits manga_id", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({ data: { title: "New Detail", description: "Story", status: 1 } });
      const detail = await source.getDetail("slug-id");
      expect(detail.id).toBe("slug-id");
    });

    it("maps valid detail correctly", async () => {
      const { source, get } = makeAdapter();
      get.mockResolvedValue({
        data: {
          manga_id: "m-1",
          title: "Manga 1",
          description: "<p>Cerita utama.</p>",
          status: 1,
          author: "Author 1",
          genres: [{ name: "Action" }],
        },
      });
      const detail = await source.getDetail("m-1");
      expect(detail.id).toBe("m-1");
      expect(detail.title).toBe("Manga 1");
      expect(detail.description).toBe("Cerita utama.");
      expect(detail.status).toBe("ONGOING");
    });
  });

  describe("metadata parity", () => {
    it("exposes V1 Source Engine metadata fields", () => {
      const { source } = makeAdapter();
      expect(source.id).toBe("shinigami");
      expect(source.adapterVersion).toBe("1.1.0");
      expect(source.upstreamDomain).toBe("api.shinigami.io");
      expect(source.supportedLanguages).toEqual(["id"]);
      expect(source.capabilities.search).toBe(true);
      expect(source.capabilities.popular).toBe(true);
    });
  });
});