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

export class KiryuuSource implements MangaSource {
  id = "kiryuu";
  name = "Kiryuu";
  description = "Baca Manga dan Manhwa Bahasa Indonesia";
  language = "id";
  baseUrl = "https://kiryuu.id"; // Kiryuu current domain
  version = "1.0.0";
  icon = "https://kiryuu.id/favicon.ico";
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

  private client = new HttpClient(this.baseUrl);

  private async fetchHtml(path: string): Promise<cheerio.CheerioAPI> {
    const html = await this.client.getHtml(path);
    return cheerio.load(html);
  }

  private parseMangaList($: cheerio.CheerioAPI): MangaPageResult {
    const mangas: any[] = [];
    $(".bs .bsx").each((_, el) => {
      const title = $(el).find(".tt").text().trim() || $(el).find("a").attr("title")?.trim();
      const href = $(el).find("a").attr("href") || "";
      const id = href.replace(this.baseUrl, "").replace(/\/$/, "");
      const coverUrl = $(el).find("img").attr("src") || "";

      let status = "UNKNOWN";
      const statusText = $(el).find(".status").text().toLowerCase();
      if (statusText.includes("ongoing")) status = "ONGOING";
      if (statusText.includes("completed")) status = "COMPLETED";

      if (id && title) {
        mangas.push({ id, title, coverUrl, status, format: "Manga" });
      }
    });

    const hasNextPage = $(".hpage .r").length > 0;
    return { mangas, hasNextPage };
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const $ = await this.fetchHtml(`/manga/?page=${page}&order=popular`);
    return this.parseMangaList($);
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const $ = await this.fetchHtml(`/manga/?page=${page}&order=update`);
    return this.parseMangaList($);
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    const searchParams = new URLSearchParams({ s: query });
    const $ = await this.fetchHtml(`/page/${page}/?${searchParams.toString()}`);
    return this.parseMangaList($);
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const $ = await this.fetchHtml(`${mangaId}`);

    const title = $(".infox h1").text().trim() || $(".entry-title").text().trim();
    const coverUrl = $(".thumb img").attr("src") || "";
    const description = $(".entry-content").text().trim();
    
    let author = "Unknown";
    let status: MangaDetail["status"] = "UNKNOWN";
    const genres: string[] = [];

    $(".tsinfo .imptdt").each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes("author")) author = text.replace("author", "").trim();
      if (text.includes("status")) {
        if (text.includes("ongoing")) status = "ONGOING";
        if (text.includes("completed")) status = "COMPLETED";
      }
    });

    $(".mgen a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    return {
      id: mangaId,
      title,
      coverUrl,
      description,
      author,
      artist: "",
      genres,
      status,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const $ = await this.fetchHtml(`${mangaId}`);
    const chapters: Chapter[] = [];

    $("#chapterlist li").each((_, el) => {
      const numStr = $(el).attr("data-num") || "0";
      const href = $(el).find("a").attr("href") || "";
      const id = href.replace(this.baseUrl, "").replace(/\/$/, "");
      const title = $(el).find(".chapternum").text().trim();
      const date = $(el).find(".chapterdate").text().trim();

      if (id) {
        chapters.push({
          id,
          mangaId,
          number: parseFloat(numStr),
          title: title || `Chapter ${numStr}`,
          date,
          scanlator: "Kiryuu",
        });
      }
    });

    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const $ = await this.fetchHtml(`${chapterId}`);
    const pages: { index: number; url: string }[] = [];

    let imgs = $("#readerarea img");
    if (imgs.length === 0) imgs = $(".reader-area img");

    imgs.each((index, el) => {
      const url = $(el).attr("src") || $(el).attr("data-src") || "";
      if (url && !url.endsWith(".gif")) {
        pages.push({ index, url });
      }
    });

    return { chapterId, pages };
  }

  getFilters(): FilterList {
    return { genres: [], formats: [], statuses: [], sorts: [] };
  }
}
