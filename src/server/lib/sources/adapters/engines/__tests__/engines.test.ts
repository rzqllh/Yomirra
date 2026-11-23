import { describe, expect, it, vi } from "vitest";
import {
  portedKeiyoushiSources,
  MangaThemesiaEngine,
  NatsuIdEngine,
  AinzScansSource,
  AkumaSource,
  HentaiHandSource,
} from "../index";
import { sources, sourceMap, builtInSources } from "../../index";
import { getStagedKeiyoushiSource } from "../../keiyoushi";
import { SourceError } from "../../../error";

describe("Keiyoushi Ported Engines & Adapters", () => {
  describe("Inventory & Metadata Integrity", () => {
    it("exports exactly 27 ported sources", () => {
      expect(portedKeiyoushiSources).toHaveLength(27);
    });

    it("keeps nine public built-ins and exposes no ported adapter by default", () => {
      expect(builtInSources).toHaveLength(9);
      expect(sources).toHaveLength(9);
      expect(sourceMap.size).toBe(9);
      const verifiedPreviously = ["manhwa-list", "izanamiscans", "kiryuu", "astral-scans"];
      for (const id of verifiedPreviously) {
        expect(sourceMap.has(id)).toBe(false);
        expect(getStagedKeiyoushiSource(id)).toBeDefined();
      }
      for (const s of portedKeiyoushiSources) {
        const staged = getStagedKeiyoushiSource(s.id);
        expect(staged).toBeDefined();
        expect(staged?.id).toBe(s.id);
      }
    });

    it("retains internally probed engines without publishing them; remaining engines stay in-dev", () => {
      const verifiedIds = ["manhwa-list", "izanamiscans", "kiryuu", "astral-scans"];
      for (const id of verifiedIds) {
        const s = portedKeiyoushiSources.find((item) => item.id === id)!;
        expect(s).toBeDefined();
        expect(s.isEnabled).toBe(true);
        expect(s.status).toBe("unknown");
      }

      const remaining = portedKeiyoushiSources.filter((s) => !verifiedIds.includes(s.id));
      expect(remaining).toHaveLength(23);
      for (const s of remaining) {
        expect(s.isEnabled).toBe(false);
        expect(s.status).toBe("in-dev");
        expect(s.isInstalled).toBe(true);
        expect(s.isDynamic).toBe(false);
        expect(s.capabilities.download).toBe(false);
        expect(s.baseUrl).toBeTruthy();
        expect(s.upstreamDomain).toBeTruthy();
        expect(s.name).toBeTruthy();
        expect(s.id).toMatch(/^[a-z0-9\-]+$/);
      }
    });

    it("has unique source IDs across all registered sources", () => {
      const ids = sources.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("correctly segregates NSFW, MIXED, and SFW categories", () => {
      const nsfwSources = portedKeiyoushiSources.filter((s) => s.isNsfw);
      const sfwSources = portedKeiyoushiSources.filter((s) => !s.isNsfw && (s as any).category === "SFW");
      const mixedSources = portedKeiyoushiSources.filter((s) => !s.isNsfw && (s as any).category === "MIXED");

      // Astral, Dojing, Doujinku, KumaPoi, Mangasusu, ManhwaDesu, ManhwaLand, Mihentai, Sekte Doujin,
      // Ryukomik, CrotPedia, DreamTeams, Hentai Crot, Pix Hentai, Shiro Doujin, Tooncubus, Akuma, HentaiHand = 18 NSFW
      expect(nsfwSources).toHaveLength(18);

      // Manhwa List, Izanami Scans, Soul Scans, Ainz Scans ID = 4 SFW
      expect(sfwSources).toHaveLength(4);

      // CosmicScans, Kiryuu, Manhwa Indo, MikoRoku, Manhuarm = 5 MIXED
      expect(mixedSources).toHaveLength(5);

      expect(nsfwSources.length + sfwSources.length + mixedSources.length).toBe(27);
    });
  });

  describe("Content Policy & Safe Mode Gate Enforcement", () => {
    it("denies access to NSFW sources when safe mode is active (hideNsfw: true or undefined)", async () => {
      const nsfwAdapter = portedKeiyoushiSources.find((s) => s.id === "astral-scans")!;
      expect(nsfwAdapter.isNsfw).toBe(true);

      // Listing methods return empty
      const popular = await nsfwAdapter.getPopular(1);
      expect(popular.mangas).toEqual([]);
      expect(popular.hasNextPage).toBe(false);

      const latest = await nsfwAdapter.getLatest(1);
      expect(latest.mangas).toEqual([]);
      expect(latest.hasNextPage).toBe(false);

      const search = await nsfwAdapter.search("test", 1);
      expect(search.mangas).toEqual([]);
      expect(search.hasNextPage).toBe(false);

      // Detail, chapters, pages throw CONTENT_POLICY_RESTRICTED (403)
      await expect(nsfwAdapter.getDetail("test")).rejects.toThrow(SourceError);
      await expect(nsfwAdapter.getChapters("test")).rejects.toThrow(SourceError);
      await expect(nsfwAdapter.getPages("test/ch-1")).rejects.toThrow(SourceError);

      try {
        await nsfwAdapter.getDetail("test");
      } catch (err) {
        expect(err).toBeInstanceOf(SourceError);
        const se = err as SourceError;
        expect(se.code).toBe("CONTENT_RESTRICTED");
        expect(se.statusCode).toBe(403);
      }
    });

    it("allows MIXED sources to browse safe content but filters adult titles under safe-mode", () => {
      const mixedAdapter = portedKeiyoushiSources.find((s) => s.id === "cosmicscans")! as any;
      expect(mixedAdapter.category).toBe("MIXED");
      expect(mixedAdapter.isNsfw).toBe(false);

      const mockItems = {
        mangas: [
          { id: "1", title: "Safe Fantasy Adventure", coverUrl: "https://example.com/1.jpg" },
          { id: "2", title: "Explicit Hentai Doujin", coverUrl: "https://example.com/2.jpg" },
          { id: "3", title: "Action Shounen 18+", coverUrl: "https://example.com/3.jpg" },
          { id: "4", title: "Slice of Life", coverUrl: "https://example.com/4.jpg" },
        ],
        hasNextPage: true,
      };

      const filtered = mixedAdapter.filterListingResults(mockItems, { hideNsfw: true });
      expect(filtered.mangas).toHaveLength(2);
      expect(filtered.mangas.map((m: any) => m.id)).toEqual(["1", "4"]);
    });
  });

  describe("MangaThemesiaEngine Parser Capabilities", () => {
    it("extracts reader pages from ts_reader.run JSON payload", async () => {
      const engine = new MangaThemesiaEngine({
        id: "test-themesia",
        name: "Test Themesia",
        baseUrl: "https://example.com",
        category: "SFW",
        isNsfw: false,
      });

      const mockHtml = `
        <html>
          <body>
            <script>
              ts_reader.run({"sources":[{"images":["https://cdn.example.com/p1.jpg","https://cdn.example.com/p2.jpg"]}]});
            </script>
          </body>
        </html>
      `;

      vi.spyOn((engine as any).client, "getHtml").mockResolvedValue(mockHtml);

      const pages = await engine.getPages("chapter-1");
      expect(pages.chapterId).toBe("chapter-1");
      expect(pages.pages).toHaveLength(2);
      expect(pages.pages[0]).toEqual({
        index: 1,
        url: "https://cdn.example.com/p1.jpg",
        referer: "https://example.com/",
      });
      expect(pages.pages[1]).toEqual({
        index: 2,
        url: "https://cdn.example.com/p2.jpg",
        referer: "https://example.com/",
      });
    });

    it("falls back to #readerarea img when ts_reader is absent", async () => {
      const engine = new MangaThemesiaEngine({
        id: "test-themesia",
        name: "Test Themesia",
        baseUrl: "https://example.com",
        category: "SFW",
        isNsfw: false,
      });

      const mockHtml = `
        <div id="readerarea">
          <img src="https://cdn.example.com/page1.jpg" />
          <img data-src="https://cdn.example.com/page2.jpg" />
          <img src="data:image/svg+xml;base64,spacer" />
        </div>
      `;

      vi.spyOn((engine as any).client, "getHtml").mockResolvedValue(mockHtml);

      const pages = await engine.getPages("chapter-2");
      expect(pages.pages).toHaveLength(2);
      expect(pages.pages[0].url).toBe("https://cdn.example.com/page1.jpg");
      expect(pages.pages[1].url).toBe("https://cdn.example.com/page2.jpg");
    });

    it("parses manga details and chapters accurately", async () => {
      const engine = new MangaThemesiaEngine({
        id: "test-themesia",
        name: "Test Themesia",
        baseUrl: "https://example.com",
        category: "SFW",
        isNsfw: false,
      });

      const mockDetailHtml = `
        <h1 class="entry-title">Solo Bug Leveling</h1>
        <div class="entry-content entry-content-single">Sebuah cerita tentang developer melawan bug.</div>
        <div class="thumb"><img src="https://cdn.example.com/cover.jpg" /></div>
        <div class="mgen"><a href="/genres/action/">Action</a><a href="/genres/fantasy/">Fantasy</a></div>
        <div class="tsinfo"><div class="imptdt">Status <i>Ongoing</i></div><div class="imptdt">Author <i>Kiyo</i></div></div>
        <div id="chapterlist">
          <ul>
            <li data-num="1"><a href="https://example.com/ch-1/"><span class="chapternum">Chapter 1</span></a><span class="chapterdate">2026-11-10</span></li>
            <li data-num="2" class="locked"><a href="https://example.com/ch-2/"><span class="chapternum">Chapter 2</span><i class="fa-lock"></i></a><span class="chapterdate">2026-11-10</span></li>
          </ul>
        </div>
      `;

      vi.spyOn((engine as any).client, "getHtml").mockResolvedValue(mockDetailHtml);

      const detail = await engine.getDetail("solo-bug-leveling");
      expect(detail.title).toBe("Solo Bug Leveling");
      expect(detail.description).toContain("developer melawan bug");
      expect(detail.status).toBe("ONGOING");
      expect(detail.genres).toEqual(["Action", "Fantasy"]);
      expect(detail.author).toBe("Kiyo");

      const chapters = await engine.getChapters("solo-bug-leveling");
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe("Chapter 1");
      expect(chapters[0].number).toBe(1);
      expect(chapters[0].isLocked).toBe(false);
      expect(chapters[1].title).toBe("Chapter 2");
      expect(chapters[1].number).toBe(2);
      expect(chapters[1].isLocked).toBe(true);
    });
  });

  describe("NatsuIdEngine AJAX & Search Behavior", () => {
    it("handles advanced search and chapter parsing", async () => {
      const engine = new NatsuIdEngine({
        id: "test-natsuid",
        name: "Test NatsuId",
        baseUrl: "https://natsuid.example",
        category: "SFW",
        isNsfw: false,
      });

      const mockSearchHtml = `
        <div class="listupd">
          <div class="bs">
            <a href="https://natsuid.example/manga/quest-one/" title="Quest One">
              <img src="https://natsuid.example/cover.jpg" />
              <div class="tt">Quest One</div>
              <div class="lsch"><a href="#">Ch. 10</a></div>
            </a>
          </div>
        </div>
      `;

      vi.spyOn((engine as any).client, "getText").mockResolvedValue(mockSearchHtml);

      const result = await engine.search("quest", 1);
      expect(result.mangas).toHaveLength(1);
      expect(result.mangas[0].id).toBe("quest-one");
      expect(result.mangas[0].title).toBe("Quest One");
      expect(result.mangas[0].latestChapter).toBe("Ch. 10");
    });
  });

  describe("Dedicated REST API Adapters", () => {
    it("handles AinzScansSource JSON API contract", async () => {
      const ainz = new AinzScansSource();
      expect(ainz.id).toBe("ainz-scans-id");
      expect(ainz.isNsfw).toBe(false);

      vi.spyOn((ainz as any).client, "get").mockImplementation(async (path: any) => {
        const p = String(path);
        if (p.includes("/popular")) {
          return {
            results: [
              { id: "101", title: "Ainz Comic", thumbnail: "https://example.com/c101.jpg" },
            ],
            hasNextPage: false,
          };
        }
        if (path.includes("/detail/101")) {
          return {
            id: "101",
            title: "Ainz Comic",
            description: "API sourced manga",
            status: "Completed",
            genres: ["Sci-Fi"],
          };
        }
        if (path.includes("/chapters/101")) {
          return {
            chapters: [
              { id: "c1", number: 1, name: "Intro" },
            ],
          };
        }
        if (path.includes("/pages/101/c1")) {
          return {
            pages: [
              { index: 1, url: "https://example.com/p1.jpg" },
            ],
          };
        }
        return {};
      });

      const pop = await ainz.getPopular(1);
      expect(pop.mangas).toHaveLength(1);
      expect(pop.mangas[0].title).toBe("Ainz Comic");

      const detail = await ainz.getDetail("101");
      expect(detail.status).toBe("COMPLETED");

      const chapters = await ainz.getChapters("101");
      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe("Intro");

      const pages = await ainz.getPages("101/c1");
      expect(pages.pages).toHaveLength(1);
      expect(pages.pages[0].url).toBe("https://example.com/p1.jpg");
    });

    it("verifies AkumaSource and HentaiHandSource adult doujin fallback", async () => {
      const akuma = new AkumaSource();
      const hentaihand = new HentaiHandSource();

      expect(akuma.isNsfw).toBe(true);
      expect(hentaihand.isNsfw).toBe(true);

      const mockDetailHtml = `
        <h1>Adult Gallery One</h1>
        <div class="description">Sample adult work</div>
        <img class="cover" src="https://example.com/cover.jpg" />
        <a href="/tag/romance">Romance</a>
      `;

      vi.spyOn((akuma as any).client, "getHtml").mockResolvedValue(mockDetailHtml);

      // When hideNsfw: false, access is granted
      const detail = await akuma.getDetail("gallery-1", { hideNsfw: false });
      expect(detail.title).toBe("Adult Gallery One");
      expect(detail.isNsfw).toBe(true);

      const chapters = await akuma.getChapters("gallery-1", { hideNsfw: false });
      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe("Complete Gallery");
    });
  });
});
