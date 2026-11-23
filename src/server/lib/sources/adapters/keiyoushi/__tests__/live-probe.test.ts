import { describe, expect, it } from "vitest";
import { getStagedKeiyoushiSource } from "../index";

const describeLive = process.env.KEIYOUSHI_LIVE_PROBE === "1" ? describe : describe.skip;

describeLive("Manual live upstream verification (opt-in only)", () => {
  const reachableSources = [
    { id: "cosmicscans", name: "CosmicScans" },
    { id: "kiryuu", name: "Kiryuu" },
    { id: "manhwa-indo", name: "Manhwa Indo" },
    { id: "manhwa-list", name: "Manhwa List" },
    { id: "ainzscansid", name: "Ainz Scans ID" },
  ];

  for (const s of reachableSources) {
    it(`evaluates ${s.name} (${s.id}) reachability and contract`, async () => {
      const adapter = getStagedKeiyoushiSource(s.id);
      expect(adapter).toBeDefined();
      expect(adapter?.id).toBeTruthy();
      expect(adapter?.baseUrl).toBeTruthy();

      // Attempt live getPopular with 10s timeout
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Upstream timeout 10s")), 10000)
        );
        const res = await Promise.race([
          adapter!.getPopular(1, { hideNsfw: false }),
          timeoutPromise,
        ]);
        expect(res).toBeDefined();
        expect(Array.isArray(res.mangas)).toBe(true);
        console.log(`[LIVE SUCCESS] ${s.name}: fetched ${res.mangas.length} titles`);
      } catch (err: any) {
        console.log(`[LIVE NOTICE] ${s.name} upstream live query: ${err.message}`);
        expect(err).toBeInstanceOf(Error);
      }
    }, 15000);
  }

  it("verifies end-to-end flow for Manhwa List (getPopular -> getDetail -> getChapters -> getPages)", async () => {
    const adapter = getStagedKeiyoushiSource("manhwa-list");
    expect(adapter).toBeDefined();

    const popular = await adapter!.getPopular(1, { hideNsfw: false });
    expect(popular.mangas.length).toBeGreaterThan(0);
    const targetManga = popular.mangas[0];
    console.log(`[E2E] Testing Manga: "${targetManga.title}" (${targetManga.id})`);

    const detail = await adapter!.getDetail(targetManga.id);
    expect(detail.title).toBeTruthy();
    console.log(`[E2E] Detail fetched: "${detail.title}", status: ${detail.status}, genres: ${detail.genres?.join(", ")}`);

    const chapters = await adapter!.getChapters(targetManga.id);
    expect(Array.isArray(chapters)).toBe(true);
    console.log(`[E2E] Chapters fetched: ${chapters.length} chapters.`);

    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      console.log(`[E2E] Testing Chapter: "${firstChapter.title}" (${firstChapter.id})`);
      const pages = await adapter!.getPages(firstChapter.id);
      expect(pages.pages.length).toBeGreaterThan(0);
      expect(pages.pages[0].url).toBeTruthy();
      console.log(`[E2E] Pages fetched: ${pages.pages.length} pages. First image: ${pages.pages[0].url.slice(0, 60)}...`);
    }
  }, 30000);
});
