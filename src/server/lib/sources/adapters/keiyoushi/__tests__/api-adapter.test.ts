import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "../../base/http-client";
import { KEIYOUSHI_CANDIDATES } from "@/shared/sources/keiyoushi-candidates";
import { KeiyoushiApiAdapter } from "../api-adapter";

const getCandidate = (id: string) => KEIYOUSHI_CANDIDATES.find(c => c.id === id)!;

describe("Keiyoushi API prototypes remain diagnostic-only", () => {
  it("normalizes the Ainz search/chapter/page wire format without arbitrary URLs", async () => {
    const get = vi.fn(async (path: string) => {
      if (path.startsWith("/search")) return { results: [
        { id: "series1", title: "Test Series", thumbnail: "https://cdn.example/cover.webp" },
      ] };
      if (path === "/chapters/series1") return { chapters: [
        { id: "chapter1", name: "Chapter 1", number: 1 },
      ] };
      if (path === "/pages/series1/chapter1") return { pages: [
        { url: "https://cdn.example/page.webp", index: 1 },
      ] };
      return { id: "series1", title: "Test Series", description: "Example" };
    });
    const adapter = new KeiyoushiApiAdapter(getCandidate("ainzscansid"), { get } as unknown as HttpClient);
    expect(adapter.isEnabled).toBe(false);
    expect((await adapter.search("test", 1)).mangas[0]).toEqual(expect.objectContaining({
      id: "series1", title: "Test Series",
    }));
    const chapters = await adapter.getChapters("series1");
    expect(chapters[0].id).toBe("series1::chapter1");
    expect((await adapter.getPages(chapters[0].id)).pages).toEqual([
      { index: 0, url: "https://cdn.example/page.webp" },
    ]);
    await expect(adapter.getPages("https://evil.example/page")).rejects.toThrow();
    expect(get).toHaveBeenCalledTimes(3);
  });

  it("rejects schema drift rather than silently accepting an empty Ainz catalog", async () => {
    const adapter = new KeiyoushiApiAdapter(
      getCandidate("ainzscansid"),
      { get: vi.fn(async () => ({ unknown: true })) } as unknown as HttpClient
    );
    await expect(adapter.search("test", 1)).rejects.toThrow("schema not verified");
  });

  it("preserves MangaToon episode paywall flags", async () => {
    const adapter = new KeiyoushiApiAdapter(
      getCandidate("mangatoon-limited"),
      { get: vi.fn(async () => ({ data: { episodes: [
        { id: "ep1", title: "Episode 1", order: 1, is_free: false },
      ] } })) } as unknown as HttpClient
    );
    const chapters = await adapter.getChapters("test");
    expect(chapters[0]).toMatchObject({ id: "ep1", isLocked: true });
  });

  it("rejects unexpected MANGA Plus data schema without guessing pages", async () => {
    const adapter = new KeiyoushiApiAdapter(
      getCandidate("manga-plus-by-shueisha"),
      { get: vi.fn(async () => ({ success: {} })) } as unknown as HttpClient
    );
    await expect(adapter.search("test", 1)).rejects.toThrow("schema not verified");
  });
});
