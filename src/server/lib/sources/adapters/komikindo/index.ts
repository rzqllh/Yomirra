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

export class KomikindoSource implements MangaSource {
  id = "komikindo";
  name = "Komikindo";
  description = "Baca Komik Bahasa Indonesia";
  language = "id";
  baseUrl = "https://komikindo.ch";
  version = "1.0.0";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=komikindo.ch&sz=64";
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

  private getRandomUA() {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  }

  private client = new HttpClient(this.baseUrl, {
    "User-Agent": this.getRandomUA(),
    "Referer": this.baseUrl,
  });

  private parseMangaList(html: string): MangaPageResult {
    const $ = cheerio.load(html);
    const mangas: any[] = [];

    $(".animepost").each((i, el) => {
      const $el = $(el);
      const url = $el.find("a[itemprop='url']").first().attr("href") || "";
      const id = url.replace(this.baseUrl, "").replace("/komik/", "").replace(/\//g, "");
      const title = $el.find("h3 a").text().trim() || $el.find(".tt h4").text().trim();
      const coverUrl = $el.find("img[itemprop='image']").attr("src") || "";
      const latestChapter = $el.find(".lsch a").text().trim();
      const format = $el.find(".typeflag").attr("class")?.replace("typeflag", "").trim() || "Manga";
      const scoreText = $el.find(".rating i").text().trim();

      if (id && title) {
        mangas.push({
          id,
          title,
          coverUrl,
          latestChapter,
          format,
          score: parseFloat(scoreText) || undefined,
        });
      }
    });

    const hasNextPage = $(".pagination .next").length > 0 || $(".hpage .r").length > 0;

    return {
      mangas,
      hasNextPage,
    };
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/komik-populer/page/${page}/`);
    return this.parseMangaList(html);
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/komik-terbaru/page/${page}/`);
    return this.parseMangaList(html);
  }

  async search(query: string, page: number, filters?: Record<string, string | string[]>): Promise<MangaPageResult> {
    const params: Record<string, any> = { s: query || "" };

    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([k, v]) => {
        if (k === "sort") {
          const sortVal = Array.isArray(v) ? v[0] : v;
          if (sortVal === "latest") params["order"] = "update";
          else if (sortVal === "popular") params["order"] = "popular";
          else params["order"] = sortVal;
        } else if (k === "genre[]") {
          // Komikindo uses genre[] as array of strings
          const items = Array.isArray(v) ? v : [v];
          // Komikindo genres in URL are usually lowercase, like 'action'
          params["genre[]"] = items.map(g => g.toLowerCase().replace(/\s+/g, '-'));
        } else {
          params[k] = Array.isArray(v) ? v.join(",") : v;
        }
      });
    }

    // If no query and no genre filters but we have a basic sort, we can use the dedicated routes for performance.
    if (!query && !params["genre[]"]) {
       if (params["order"] === "update") return this.getLatest(page);
       if (params["order"] === "popular") return this.getPopular(page);
    }

    // Advanced search endpoint
    const html = await this.client.getHtml(`/manga/page/${page}/`, params);
    return this.parseMangaList(html);
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const html = await this.client.getHtml(`/komik/${mangaId}/`);
    const $ = cheerio.load(html);

    const title = $("h1").text().replace("Komik", "").trim();
    const coverUrl = $(".thumb img").attr("src") || $(".imes img").attr("src") || "";
    const description = $("div[itemprop='description']").text().trim();
    
    let author = "";
    let status = "UNKNOWN";
    let format = "Manga";

    $(".spe span").each((i, el) => {
      const text = $(el).text();
      if (text.includes("Pengarang")) author = text.replace("Pengarang:", "").trim();
      if (text.includes("Status")) {
        const s = text.replace("Status:", "").trim().toLowerCase();
        if (s.includes("berjalan") || s.includes("ongoing")) status = "ONGOING";
        if (s.includes("tamat") || s.includes("completed")) status = "COMPLETED";
      }
      if (text.includes("Jenis")) format = text.replace("Jenis Komik:", "").trim();
    });

    const genres: string[] = [];
    $(".genre-info a").each((i, el) => {
      genres.push($(el).text().trim());
    });

    return {
      id: mangaId,
      title,
      coverUrl,
      description,
      author,
      status: status as any,
      format,
      genres,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const html = await this.client.getHtml(`/komik/${mangaId}/`);
    const $ = cheerio.load(html);

    const chapters: Chapter[] = [];
    $("#chapter_list li").each((i, el) => {
      const $a = $(el).find(".lchx a");
      const title = $a.text().trim();
      const url = $a.attr("href") || "";
      const chapterId = url.replace(this.baseUrl, "").replace(/\//g, "");
      const date = $(el).find(".dtx").text().trim();

      // Extract number from title, e.g. "Chapter 114" -> 114
      const match = title.match(/Chapter\s*([\d\.]+)/i) || title.match(/Ch\.\s*([\d\.]+)/i);
      const number = match ? parseFloat(match[1]) : chapters.length + 1;

      if (chapterId) {
        chapters.push({
          id: chapterId,
          mangaId,
          number,
          title,
          date,
        });
      }
    });

    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const html = await this.client.getHtml(`/${chapterId}/`);
    const $ = cheerio.load(html);

    const pages: any[] = [];
    $("#chimg-auh img, .chapter-image img, #img-container img").each((i, el) => {
      // Exclude ads: usually wrapped in <a> tags, or GIF tracking pixels
      if ($(el).parent().is("a")) return;
      
      const url = $(el).attr("src") || $(el).attr("data-src");
      if (!url || url.includes(".gif")) return;
      
      pages.push({
        index: pages.length,
        url: url.trim(),
        referer: this.baseUrl,
      });
    });

    return {
      chapterId,
      pages,
    };
  }

  getFilters(): FilterList {
    return {
      genres: [],
      formats: [],
      statuses: [],
      sorts: [],
    };
  }
}
