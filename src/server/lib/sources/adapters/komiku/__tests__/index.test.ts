import { describe, expect, it, vi, beforeEach } from "vitest";
import { KomikuSource } from "../index";

describe("KomikuSource", () => {
  let source: KomikuSource;

  beforeEach(() => {
    source = new KomikuSource();
  });

  it("should have correct metadata and capabilities", () => {
    expect(source.id).toBe("komiku");
    expect(source.name).toBe("Komiku");
    expect(source.language).toBe("id");
    expect(source.baseUrl).toBe("https://komiku.org");
    expect(source.capabilities).toEqual({
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
    });
  });

  it("should parse popular manga list HTML correctly", async () => {
    const mockHtml = `
      <div class="ls4j">
        <h4><a href="/manga/solo-leveling/" title="Solo Leveling">Solo Leveling</a></h4>
        <img src="https://img.komiku.org/cover.jpg" />
        <span class="ls4l">Chapter 179</span>
      </div>
      <div class="pagination">
        <a href="https://komiku.org/daftar-komik/?halaman=2">Next →</a>
      </div>
    `;

    vi.spyOn(source["client"], "getHtml").mockResolvedValue(mockHtml);

    const result = await source.getPopular(1);
    expect(result.mangas).toHaveLength(1);
    expect(result.mangas[0]).toEqual({
      id: "solo-leveling",
      title: "Solo Leveling",
      coverUrl: "https://img.komiku.org/cover.jpg",
      latestChapter: "Chapter 179",
      format: "Manga",
    });
    expect(result.hasNextPage).toBe(true);
  });

  it("should prioritize data-src over lazy.jpg placeholder src in manga list HTML", async () => {
    const mockHtml = `
      <div class="ls4j">
        <h4><a href="/manga/oversummoned/" title="Oversummoned">Oversummoned</a></h4>
        <img class="lazy" src="https://komiku.org/asset/img/lazy.jpg" data-src="https://thumbnail.komiku.org/real-cover.webp" />
        <span class="ls4l">Chapter 1</span>
      </div>
    `;

    vi.spyOn(source["client"], "getHtml").mockResolvedValue(mockHtml);

    const result = await source.getPopular(1);
    expect(result.mangas).toHaveLength(1);
    expect(result.mangas[0].coverUrl).toBe("https://thumbnail.komiku.org/real-cover.webp");
  });

  it("should parse manga detail HTML correctly", async () => {
    const mockHtml = `
      <h1>Komik Solo Leveling</h1>
      <div class="thumb"><img src="//img.komiku.org/cover.jpg" /></div>
      <div itemprop="description"><p>A great story about hunters and level ups.</p></div>
      <table class="inftable">
        <tr><td>Pengarang:</td><td>Chugong</td></tr>
        <tr><td>Status:</td><td>Berjalan / Ongoing</td></tr>
        <tr><td>Jenis Komik:</td><td>Manhwa</td></tr>
      </table>
      <ul class="genre">
        <li><a href="/genre/action/">Action</a></li>
        <li><a href="/genre/fantasy/">Fantasy</a></li>
      </ul>
    `;

    vi.spyOn(source["client"], "getHtml").mockResolvedValue(mockHtml);

    const detail = await source.getDetail("solo-leveling");
    expect(detail).toEqual({
      id: "solo-leveling",
      title: "Solo Leveling",
      coverUrl: "https://img.komiku.org/cover.jpg",
      description: "A great story about hunters and level ups.",
      author: "Chugong",
      status: "ONGOING",
      format: "Manhwa",
      genres: ["Action", "Fantasy"],
    });
  });

  it("should parse chapter list HTML correctly", async () => {
    const mockHtml = `
      <table id="Daftar_Chapter">
        <tr>
          <td class="judulseries"><a href="/ch/solo-leveling-chapter-179/">Chapter 179</a></td>
          <td class="tgl">2 jam lalu</td>
        </tr>
        <tr>
          <td class="judulseries"><a href="/ch/solo-leveling-chapter-178/">Chapter 178</a></td>
          <td class="tgl">1 hari lalu</td>
        </tr>
      </table>
    `;

    vi.spyOn(source["client"], "getHtml").mockResolvedValue(mockHtml);

    const chapters = await source.getChapters("solo-leveling");
    expect(chapters).toHaveLength(2);
    expect(chapters[0]).toEqual({
      id: "solo-leveling-chapter-179",
      mangaId: "solo-leveling",
      number: 179,
      title: "Chapter 179",
      date: "2 jam lalu",
    });
    expect(chapters[1]).toEqual({
      id: "solo-leveling-chapter-178",
      mangaId: "solo-leveling",
      number: 178,
      title: "Chapter 178",
      date: "1 hari lalu",
    });
  });

  it("should parse reader pages HTML with lazy attributes and deduplication", async () => {
    const mockHtml = `
      <div id="Baca_Komik">
        <img src="https://img.komiku.org/p1.jpg" />
        <img data-src="https://img.komiku.org/p2.jpg" />
        <img src="https://img.komiku.org/p2.jpg" /> <!-- Duplicate -->
        <img src="https://img.komiku.org/ad.gif" /> <!-- Excluded gif -->
      </div>
    `;

    vi.spyOn(source["client"], "getHtml").mockResolvedValue(mockHtml);

    const pages = await source.getPages("solo-leveling-chapter-179");
    expect(pages.chapterId).toBe("solo-leveling-chapter-179");
    expect(pages.pages).toEqual([
      { index: 0, url: "https://img.komiku.org/p1.jpg", referer: "https://komiku.org" },
      { index: 1, url: "https://img.komiku.org/p2.jpg", referer: "https://komiku.org" },
    ]);
  });
});
