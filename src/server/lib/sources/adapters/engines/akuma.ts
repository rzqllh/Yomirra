import * as cheerio from "cheerio";
import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaItem,
  MangaPageResult,
  PageItem,
  SourceReadOptions,
} from "@/shared/sources/source-types";
import { BaseEngine } from "./base-engine";
import { SourceError } from "../../error";

export class AkumaSource extends BaseEngine {
  constructor() {
    super({
      id: "akuma",
      name: "Akuma",
      description: "Adult manga and doujinshi reader",
      language: "en",
      baseUrl: "https://akuma.moe",
      category: "NSFW",
      isNsfw: true,
      supportedLanguages: ["en", "ja"],
    });
  }

  protected parseMangaItems($: cheerio.CheerioAPI): MangaItem[] {
    const mangas: MangaItem[] = [];

    $("a[href*='/manga/'], a[href*='/series/'], a[href*='/comic/']").each((_, el) => {
      const $el = $(el);
      const link = $el.attr("href") || "";
      const title = $el.attr("title")?.trim() || $el.find("h3, h4, .title").text().trim();
      const coverUrl =
        $el.find("img").attr("data-src") ||
        $el.find("img").attr("data-lazy-src") ||
        $el.find("img").attr("src") ||
        "";

      const match = link.match(/\/(manga|series|comic)\/([^\/]+)\/?/);
      const id = match ? match[2] : link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

      if (id && title && !mangas.some((m) => m.id === id)) {
        mangas.push({
          id,
          title,
          coverUrl,
          isNsfw: true,
          contentRating: "pornographic",
        });
      }
    });

    return mangas;
  }

  async getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    if (options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    try {
      const html = await this.client.getHtml(`/popular?page=${p}`);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".pagination .next, a.next").length > 0;
      return { mangas, hasNextPage };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async getLatest(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    if (options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    try {
      const html = await this.client.getHtml(`/latest?page=${p}`);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".pagination .next, a.next").length > 0;
      return { mangas, hasNextPage };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async search(
    query: string,
    page: number,
    _filters?: Record<string, string | string[]>,
    options?: SourceReadOptions
  ): Promise<MangaPageResult> {
    if (options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    try {
      const html = await this.client.getHtml(`/?s=${encodeURIComponent(query)}&page=${p}`);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".pagination .next, a.next").length > 0;
      return { mangas, hasNextPage };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail> {
    this.enforceContentPolicy("detail", options);

    const path = mangaId.startsWith("http")
      ? mangaId
      : `/manga/${encodeURIComponent(mangaId)}/`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);

      const title =
        $("h1").first().text().trim() || $(".title").first().text().trim() || mangaId;

      const description =
        $(".entry-content, .synopsis, .description").first().text().trim() || "";

      const coverUrl =
        $("img.cover, img.thumb, .summary_image img").attr("data-src") ||
        $("img.cover, img.thumb, .summary_image img").attr("src") ||
        "";

      const genres: string[] = [];
      $("a[href*='/tag/'], a[href*='/genre/']").each((_, el) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });

      return {
        id: mangaId,
        title,
        coverUrl,
        description,
        genres,
        status: "COMPLETED",
        isNsfw: true,
        contentRating: "pornographic",
      };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "detail");
    }
  }

  async getChapters(mangaId: string, options?: SourceReadOptions): Promise<Chapter[]> {
    this.enforceContentPolicy("chapters", options);

    const path = mangaId.startsWith("http")
      ? mangaId
      : `/manga/${encodeURIComponent(mangaId)}/`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const chapters: Chapter[] = [];

      $("a[href*='/chapter-'], a[href*='/ch-'], #chapterlist a, .chapters a").each(
        (idx, el) => {
          const $el = $(el);
          const link = $el.attr("href") || "";
          if (!link) return;

          const title = $el.text().trim() || `Chapter ${idx + 1}`;
          const numMatch = title.match(/(\d+(?:\.\d+)?)/);
          const number = numMatch ? parseFloat(numMatch[1]) : idx + 1;

          const id = link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

          chapters.push({
            id,
            mangaId,
            number,
            title,
            date: "",
            url: link,
          });
        }
      );

      // Single-chapter doujinshi fallback
      if (chapters.length === 0) {
        chapters.push({
          id: mangaId,
          mangaId,
          number: 1,
          title: "Complete Gallery",
          date: "",
          url: path,
        });
      }

      return chapters;
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "chapters");
    }
  }

  async getPages(chapterId: string, options?: SourceReadOptions): Promise<ChapterPages> {
    this.enforceContentPolicy("pages", options);

    const path = chapterId.startsWith("http")
      ? chapterId
      : `/${chapterId.replace(/^\/+/, "")}`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const pages: PageItem[] = [];
      let index = 1;

      $("img.page, img.reading, #readerarea img, .reader-images img").each((_, el) => {
        const $img = $(el);
        const url =
          $img.attr("data-src") ||
          $img.attr("data-lazy-src") ||
          $img.attr("src") ||
          "";

        if (url && !url.includes("data:image/svg") && !url.includes("placeholder")) {
          pages.push({
            index: index++,
            url: url.trim(),
            referer: `${this.baseUrl}/`,
          });
        }
      });

      return { chapterId, pages };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "pages");
    }
  }
}
