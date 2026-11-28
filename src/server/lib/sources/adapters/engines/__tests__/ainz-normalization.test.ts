import { describe, expect, it, vi } from "vitest";
import { AinzScansSource } from "../ainz-scans";
import { HttpClient, UpstreamHttpError } from "../../base/http-client";

describe("owner ZIP Ainz response normalization", () => {
  it("normalizes metadata without inferring content safety", async () => {
    const adapter = new AinzScansSource();
    const get = vi.spyOn(HttpClient.prototype, "get").mockResolvedValueOnce({
      results: [{ id: 12, title: " Fixture ", thumbnail: "/cover.jpg", author: [" A ", "B"] }],
    });
    try {
      expect((await adapter.search("fixture", 1)).mangas[0]).toMatchObject({
        id: "12", title: "Fixture", author: "A, B",
        coverUrl: "https://v3.ainzscans01.com/cover.jpg", contentRating: "unknown",
      });
    } finally { get.mockRestore(); }
  });
  it("rejects missing chapter identity, duplicate IDs and fabricated numbering", async () => {
    const adapter = new AinzScansSource();
    const get = vi.spyOn(HttpClient.prototype, "get");
    try {
      for (const chapters of [[{ number: 1 }], [{ id: "x", name: "Special" }], [{ id: "x", number: 1 }, { id: "x", number: 2 }]]) {
        get.mockResolvedValueOnce({ chapters });
        await expect(adapter.getChapters("12")).rejects.toMatchObject({ code: "SCHEMA_CHANGED" });
      }
      get.mockResolvedValueOnce({ chapters: [{ id: "c", number: 0, scan: "Team" }] });
      expect(await adapter.getChapters("12")).toEqual([{
        id: "12/c", mangaId: "12", number: 0, chapterNumber: "0", title: "Chapter 0", date: "", scanlator: "Team", url: undefined,
      }]);
    } finally { get.mockRestore(); }
  });
  it("requires real parent identity and validates page URLs and order", async () => {
    const adapter = new AinzScansSource();
    const get = vi.spyOn(HttpClient.prototype, "get");
    try {
      await expect(adapter.getPages("c")).rejects.toThrow();
      await expect(adapter.getPages("12/c", { mangaId: "13" })).rejects.toThrow();
      expect(get).not.toHaveBeenCalled();
      get.mockResolvedValueOnce({ pages: [{ url: "/p1.jpg", index: 0 }, { url: "https://example.test/p2.jpg", index: 1 }] });
      const result = await adapter.getPages("12/c");
      expect(result.pages.map(p => [p.index, p.url])).toEqual([[1, "https://v3.ainzscans01.com/p1.jpg"], [2, "https://example.test/p2.jpg"]]);
      get.mockResolvedValueOnce({ pages: [{ url: "javascript:alert(1)" }] });
      await expect(adapter.getPages("12/c")).rejects.toMatchObject({ code: "SCHEMA_CHANGED" });
      get.mockResolvedValueOnce({});
      await expect(adapter.getPages("12/c")).rejects.toMatchObject({ code: "SCHEMA_CHANGED" });
      for(const identity of [{mangaId:"13"},{chapterId:"other"}]){
        get.mockResolvedValueOnce({...identity,pages:["https://example.test/p1.jpg"]});
        await expect(adapter.getPages("12/c")).rejects.toMatchObject({code:"SCHEMA_CHANGED"});
      }
    } finally { get.mockRestore(); }
  });
  it("does not retry provider access denials or rate limits through search", async () => {
    const adapter = new AinzScansSource();
    const get = vi.spyOn(HttpClient.prototype, "get").mockRejectedValue(new UpstreamHttpError(429, "Too Many Requests", "60"));
    try {
      await expect(adapter.getPopular(1)).rejects.toThrow();
      expect(get).toHaveBeenCalledTimes(1);
    } finally { get.mockRestore(); }
  });
});
