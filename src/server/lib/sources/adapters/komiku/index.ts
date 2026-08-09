import * as cheerio from "cheerio";
import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  FilterList,
} from "@/shared/sources/source-types";
import { HttpClient } from "../base/http-client";

export class KomikuSource implements MangaSource {
  id = "komiku";
  name = "Komiku";
  description = "Baca Komik, Manga, Manhwa, dan Manhua Bahasa Indonesia";
  language = "id";
  baseUrl = "https://komiku.org";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=komiku.org&sz=64";
  version = "1.0.0";
  isEnabled = true;
  isInstalled = true;
  status = "online" as const;
  isNsfw = false;
  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
  };

  private client = new HttpClient(this.baseUrl, {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Referer: "https://komiku.org/",
  });

  private extractCoverUrl($img: any): string {
    if (!$img || !$img.length) return "";
    const rawSrc = $img.attr("src") || "";
    const rawDataSrc =
      $img.attr("data-src") ||
      $img.attr("data-lazy-src") ||
      $img.attr("data-original") ||
      $img.attr("lazy-src") ||
      "";

    const url = (rawDataSrc && (!rawSrc || rawSrc.includes("lazy.jpg") || rawSrc.includes("placeholder")))
      ? rawDataSrc
      : (rawSrc || rawDataSrc);

    return url.startsWith("//") ? `https:${url}` : url;
  }

  private parseMangaList(html: string): MangaPageResult {
    const $ = cheerio.load(html);
    const mangas: any[] = [];
    const seenIds = new Set<string>();

    $(".ls4j, .ls12v, .ls4, .ls12, .bmaster, .manga-card, div[class*='ls'], article").each((_, el) => {
      const $el = $(el);
      const title =
        $el.find("h4 a, h3 a").first().text().trim() ||
        $el.find("h4, h3").first().text().trim() ||
        $el.find("a[href*='/manga/'], a[href*='/komik/']").text().trim() ||
        $el.find("img").attr("alt")?.replace(/^baca\s+/i, "").trim() ||
        "";
      const a = $el.find("h4 a, h3 a, a[href*='/manga/'], a[href*='/komik/']").first();
      const href = a.attr("href") || "";
      const coverUrl = this.extractCoverUrl($el.find("img").first());
      const latestChapter = $el.find(".ls4l, .ls2l, .ch").first().text().trim();

      if (href && title && (href.includes("/manga/") || href.includes("/komik/"))) {
        const id = href
          .replace(/https?:\/\/komiku\.org/g, "")
          .replace(/^\/manga\//, "")
          .replace(/^\/komik\//, "")
          .replace(/\//g, "");

        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          mangas.push({
            id,
            title,
            coverUrl: coverUrl.startsWith("//") ? `https:${coverUrl}` : coverUrl,
            latestChapter: latestChapter || undefined,
            format: "Manga",
          });
        }
      }
    });

    if (mangas.length === 0) {
      $("h4 a[href*='/manga/'], h4 a[href*='/komik/']").each((_, el) => {
        const href = $(el).attr("href");
        const title = $(el).text().trim() || $(el).attr("title") || "";
        if (href && title) {
          const id = href
            .replace(/https?:\/\/komiku\.org/g, "")
            .replace(/^\/manga\//, "")
            .replace(/^\/komik\//, "")
            .replace(/\//g, "");

          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            mangas.push({
              id,
              title,
              coverUrl: "",
              format: "Manga",
            });
          }
        }
      });
    }

    const hasNextPage =
      $(".pagination a[href*='halaman='], .pagination a.next").length > 0 ||
      mangas.length >= 20;

    return { mangas, hasNextPage };
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/daftar-komik/?halaman=${page}`);
    return this.parseMangaList(html);
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const url = page === 1 ? "/" : `/daftar-komik/?halaman=${page}`;
    const html = await this.client.getHtml(url);
    return this.parseMangaList(html);
  }

  async search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    if (!query || query.trim().length === 0) {
      return this.getPopular(page);
    }

    try {
      const apiRes = await fetch(
        `https://api.komiku.org/?s=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://komiku.org/",
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (apiRes.ok) {
        const html = await apiRes.text();
        const $ = cheerio.load(html);
        const mangas: any[] = [];
        const seenIds = new Set<string>();

        $(".bge").each((_, el) => {
          const $el = $(el);
          const a = $el.find(".kan a, .bgei a").first();
          const href = a.attr("href") || "";
          const title = $el.find(".kan h3, h3").first().text().trim();
          const coverUrl = this.extractCoverUrl($el.find("img").first());
          const latestChapter = $el.find(".new1").last().text().replace(/\s+/g, " ").trim();

          if (
            href &&
            title &&
            title !== "Untitled" &&
            (href.includes("/manga/") || href.includes("/komik/"))
          ) {
            const id = href
              .replace(/https?:\/\/komiku\.org/g, "")
              .replace(/^\/manga\//, "")
              .replace(/^\/komik\//, "")
              .replace(/\//g, "");

            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              mangas.push({
                id,
                title,
                coverUrl,
                latestChapter: latestChapter || undefined,
                format: "Manga",
              });
            }
          }
        });

        if (mangas.length > 0) {
          return { mangas, hasNextPage: false };
        }
      }
    } catch {
      // Fallback to standard html search if API endpoint fails
    }

    const html = await this.client.getHtml(`/?s=${encodeURIComponent(query.trim())}`);
    return this.parseMangaList(html);
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const html = await this.client.getHtml(`/manga/${mangaId}/`);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().replace(/^Komik\s+/i, "").trim();
    const coverUrl = this.extractCoverUrl(
      $(".thumb img, .ims img, img[itemprop='image']").first()
    );
    const description =
      $("#Judul p, div[itemprop='description'], .desc, .sinopsis").first().text().trim() ||
      "Belum ada sinopsis.";

    let author = "";
    let status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" = "UNKNOWN";
    let format = "Manga";

    $(".inftable tr, .table tr, table.tb tr").each((_, el) => {
      const label = $(el).find("td").first().text().trim().toLowerCase();
      const val = $(el).find("td").last().text().trim();
      if (label.includes("pengarang") || label.includes("author")) author = val;
      if (label.includes("status")) {
        const s = val.toLowerCase();
        if (s.includes("berjalan") || s.includes("ongoing")) status = "ONGOING";
        if (s.includes("tamat") || s.includes("completed")) status = "COMPLETED";
      }
      if (label.includes("jenis") || label.includes("type")) format = val;
    });

    const genres: string[] = [];
    $(".genre li a, .genre a, ul.genre a").each((_, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });

    return {
      id: mangaId,
      title: title || mangaId,
      coverUrl: coverUrl.startsWith("//") ? `https:${coverUrl}` : coverUrl,
      description,
      author: author || undefined,
      status,
      format,
      genres,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const html = await this.client.getHtml(`/manga/${mangaId}/`);
    const $ = cheerio.load(html);

    const chapters: Chapter[] = [];
    const seenIds = new Set<string>();

    $("#Daftar_Chapter td.judulseries a, .ls25 a, a[href*='/ch/']").each((_, el) => {
      const $a = $(el);
      const title = $a.text().trim();
      const href = $a.attr("href") || "";
      const chapterId = href
        .replace(/https?:\/\/komiku\.org/g, "")
        .replace(/^\/ch\//, "")
        .replace(/\//g, "");
      const date = $a.closest("tr").find(".tgl").text().trim() || "";

      const match = title.match(/Chapter\s*([\d\.]+)/i) || title.match(/Ch\.\s*([\d\.]+)/i);
      const number = match ? parseFloat(match[1]) : chapters.length + 1;

      if (chapterId && !seenIds.has(chapterId)) {
        seenIds.add(chapterId);
        chapters.push({
          id: chapterId,
          mangaId,
          number,
          title: title || `Chapter ${number}`,
          date,
        });
      }
    });

    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const html = await this.client.getHtml(`/ch/${chapterId}/`);
    const $ = cheerio.load(html);

    const pages: { index: number; url: string; referer: string }[] = [];
    const seenUrls = new Set<string>();

    $("#Baca_Komik img, #baca_komik img, .baca-komik img, #pembaca img").each((_, el) => {
      if ($(el).parent().is("a")) return;
      let src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("lazy-src") ||
        "";
      if (!src || src.includes(".gif")) return;
      src = src.trim().startsWith("//") ? `https:${src.trim()}` : src.trim();

      if (!seenUrls.has(src)) {
        seenUrls.add(src);
        pages.push({
          index: pages.length,
          url: src,
          referer: this.baseUrl,
        });
      }
    });

    return {
      chapterId,
      pages,
    };
  }

  async getFilters(): Promise<FilterList> {
    return {
      genres: [],
      formats: [],
      statuses: [],
      sorts: [],
    };
  }
}
