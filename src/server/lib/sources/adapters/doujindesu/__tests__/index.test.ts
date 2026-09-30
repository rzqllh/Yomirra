import { describe, it, expect, vi, beforeEach } from "vitest";
import { DoujinDesuSource } from "../index";
import { decryptDoujinPayload, getCandidateKeys, xorDecrypt } from "../crypto";
import { HttpClient } from "../../base/http-client";
import { sourceRegistry } from "@/shared/sources/source-registry";

describe("DoujinDesuSource", () => {
  let source: DoujinDesuSource;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient({
      baseUrl: "https://doujin.desu.xxx/api",
      timeoutMs: 5000,
    });
    source = new DoujinDesuSource(mockHttpClient);
  });

  describe("Metadata & Capabilities", () => {
    it("has correct identification and default settings", () => {
      expect(source.id).toBe("doujindesu");
      expect(source.name).toBe("Doujindesu");
      expect(source.isNsfw).toBe(true);
      expect(source.isEnabled).toBe(false); // Default disabled as requested
      expect(source.status).toBe("online");
      expect(source.upstreamDomain).toBe("doujin.desu.xxx");
      expect(source.language).toBe("id");
    });

    it("declares standard reading capabilities", () => {
      expect(source.capabilities.popular).toBe(true);
      expect(source.capabilities.latest).toBe(true);
      expect(source.capabilities.search).toBe(true);
      expect(source.capabilities.detail).toBe(true);
      expect(source.capabilities.chapters).toBe(true);
      expect(source.capabilities.pages).toBe(true);
    });

    it("is registered in sourceRegistry with isNsfw=true and isEnabled=false", () => {
      const entry = sourceRegistry.find((s) => s.id === "doujindesu");
      expect(entry).toBeDefined();
      expect(entry?.isNsfw).toBe(true);
      expect(entry?.isEnabled).toBe(false);
      expect(entry?.name).toBe("Doujindesu");
    });
  });

  describe("Crypto Decryption", () => {
    it("successfully decrypts payload with candidate key", () => {
      const keys = getCandidateKeys();
      const testData = { hello: "world", count: 42 };
      const rawJson = JSON.stringify(testData);
      const encodedUri = encodeURIComponent(rawJson);

      // Encrypt with first candidate key using reverse xor
      const key = keys[0];
      const keyLen = key.length;
      let counter = 42;
      const hexParts: string[] = [];

      for (let x = 0; x < encodedUri.length; x++) {
        const charCode = encodedUri.charCodeAt(x);
        const keyChar = key.charCodeAt(x % keyLen);
        const byte = charCode ^ keyChar ^ ((x * 13) & 255) ^ counter;
        const hex = (byte & 255).toString(16).padStart(2, "0");
        hexParts.push(hex);
        counter = (counter + byte) % 256;
      }

      const encResp = hexParts.join("");
      const decrypted = decryptDoujinPayload<{ hello: string; count: number }>({
        _enc_resp_: encResp,
      });

      expect(decrypted).toEqual(testData);
    });

    it("passes through unencrypted payload gracefully", () => {
      const direct = { direct: "data" };
      expect(decryptDoujinPayload(direct)).toEqual(direct);
    });
  });

  describe("Methods", () => {
    it("getPopular formats items correctly", async () => {
      const sampleItem = {
        id: "sample-1",
        title: "Sample Doujin",
        slug: "sample-doujin",
        cover_url: "https://pic.desu.xxx/cover.webp",
        status: "ongoing",
      };

      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce([sampleItem]);

      const result = await source.getPopular(1);
      expect(result.mangas).toHaveLength(1);
      expect(result.mangas[0].title).toBe("Sample Doujin");
      expect(result.mangas[0].id).toBe("sample-doujin");
      expect(result.mangas[0].status).toBe("ONGOING");
    });

    it("search passes query correctly", async () => {
      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce([]);

      const result = await source.search("naruto", 1);
      expect(mockHttpClient.get).toHaveBeenCalledWith("/manga", {
        search: "naruto",
        page: 1,
        limit: 20,
      });
      expect(result.mangas).toEqual([]);
    });

    it("getDetail maps manga detail and genres correctly", async () => {
      const sampleDetail = {
        id: "sample-slug",
        slug: "sample-slug",
        title: "Detailed Doujin",
        cover_url: "https://pic.desu.xxx/cover.webp",
        description: "A test description",
        author: "Author A",
        status: "completed",
        manga_genres: [{ genres: { name: "Romance" } }, { genres: { name: "Comedy" } }],
        chapters: [{ id: "ch-1", chapter_number: 1, created_at: "2026-09-30" }],
      };

      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce(sampleDetail);

      const detail = await source.getDetail("sample-slug");
      expect(detail.id).toBe("sample-slug");
      expect(detail.title).toBe("Detailed Doujin");
      expect(detail.description).toBe("A test description");
      expect(detail.genres).toEqual(["Romance", "Comedy"]);
      expect(detail.status).toBe("COMPLETED");
    });

    it("getChapters extracts chapter list from detail payload", async () => {
      const sampleDetail = {
        id: "sample-slug",
        slug: "sample-slug",
        title: "Doujin With Chapters",
        cover_url: "",
        chapters: [
          { id: "ch-1", chapter_number: 1, created_at: "2026-09-30" },
          { id: "ch-2", chapter_number: 2, created_at: "2026-09-30" },
        ],
      };

      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce(sampleDetail);

      const chapters = await source.getChapters("sample-slug");
      expect(chapters).toHaveLength(2);
      expect(chapters[0].id).toBe("ch-1");
      expect(chapters[0].number).toBe(1);
      expect(chapters[0].title).toBe("Chapter 1");
      expect(chapters[1].id).toBe("ch-2");
      expect(chapters[1].number).toBe(2);
    });

    it("getPages extracts reader content_urls with proper referer", async () => {
      const sampleChapter = {
        id: "ch-1",
        chapter_number: 1,
        content_urls: [
          "https://amz-ch.desu.pics/page1.webp",
          "https://amz-ch.desu.pics/page2.webp",
        ],
      };

      vi.spyOn(mockHttpClient, "get").mockResolvedValueOnce(sampleChapter);

      const pagesResult = await source.getPages("ch-1");
      expect(pagesResult.chapterId).toBe("ch-1");
      expect(pagesResult.pages).toHaveLength(2);
      expect(pagesResult.pages[0].url).toBe("https://amz-ch.desu.pics/page1.webp");
      expect(pagesResult.pages[0].index).toBe(0);
      expect(pagesResult.pages[0].referer).toBe("https://doujin.desu.xxx/");
      expect(pagesResult.pages[1].url).toBe("https://amz-ch.desu.pics/page2.webp");
      expect(pagesResult.pages[1].index).toBe(1);
    });
  });
});
