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
import type { GenericWpConfig } from "./types";
import { SourceError } from "../../error";

export class GenericWpEngine extends BaseEngine {
  protected seriesPathRegex: RegExp;

  constructor(config: GenericWpConfig) {
    super(config);
    this.seriesPathRegex =
      config.seriesPathRegex ?? /\/(manga|comic|series|komik)\/([^\/]+)\/?/;
  }

  protected parseMangaItems($: cheerio.CheerioAPI): MangaItem[] {
    const mangas: MangaItem[] = [];

    $("article, .bsx, .animposx, .manga-item, .post-item, .comic-item, .listupd .bs").each(
      (_, el) => {
        const $el = $(el);
        const link =
          $el.find("a[href*='/manga/'], a[href*='/comic/'], a[href*='/series/'], a[href*='/komik/']").attr("href") ||
          $el.find("a").first().attr("href") ||
          "";
        if (!link) return;

        const title =
          $el.find(".title, .tt, h3, h4, h2").first().text().trim() ||
          $el.find("a").first().attr("title")?.trim() ||
          "";

        const coverUrl =
          $el.find("img").attr("data-src") ||
          $el.find("img").attr("data-lazy-src") ||
          $el.find("img").attr("src") ||
          "";

        const latestChapter =
          $el.find(".lsch a, .chapter, .epxs").first().text().trim() || undefined;

        const match = link.match(this.seriesPathRegex);
        const id = match ? match[2] : link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

        if (id && title) {
          mangas.push({
            id,
            title,
            coverUrl,
            latestChapter,
            isNsfw: this.isNsfw,
            contentRating: this.isNsfw ? "pornographic" : "safe",
          });
        }
      }
    );

    return mangas;
  }

  async getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    if (this.isNsfw && options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    const path = `/manga/?order=popular&page=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".pagination .next, a.next, .nav-previous").length > 0;
      return this.filterListingResults({ mangas, hasNextPage }, options);
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async getLatest(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    if (this.isNsfw && options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    const path = `/manga/?order=update&page=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".pagination .next, a.next, .nav-previous").length > 0;
      return this.filterListingResults({ mangas, hasNextPage }, options);
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
    if (this.isNsfw && options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    const path = `/?s=${encodeURIComponent(query)}&page=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".pagination .next, a.next, .nav-previous").length > 0;
      return this.filterListingResults({ mangas, hasNextPage }, options);
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
        $("h1.entry-title, .post-title, h1").first().text().trim() || mangaId;

      const description =
        $(".entry-content, .synopsis, .desc, .summary").first().text().trim() || "";

      const coverUrl =
        $(".thumb img, .poster img, .series-thumb img").attr("data-src") ||
        $(".thumb img, .poster img, .series-thumb img").attr("data-lazy-src") ||
        $(".thumb img, .poster img, .series-thumb img").attr("src") ||
        "";

      const genres: string[] = [];
      $(".genres a, .mgen a, a[rel='tag'], .genre a").each((_, el) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });

      let status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" = "UNKNOWN";
      const statusText = $(".status, .imptdt:contains('Status') i, .infotable")
        .text()
        .toLowerCase();
      if (statusText.includes("ongoing") || statusText.includes("berjalan")) status = "ONGOING";
      else if (statusText.includes("completed") || statusText.includes("tamat")) status = "COMPLETED";

      const author =
        $(".author, .imptdt:contains('Author') i, .infotable tr:contains('Author') td:last-child")
          .first()
          .text()
          .trim() || undefined;

      return {
        id: mangaId,
        title,
        coverUrl,
        description,
        genres,
        status,
        author,
        isNsfw: this.isNsfw,
        contentRating: this.isNsfw ? "pornographic" : "safe",
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

      $("#chapterlist ul li, .clstyle li, .chapter-list li, ul.chapters li, .eplister li").each(
        (idx, el) => {
          const $el = $(el);
          const link = $el.find("a").first().attr("href") || "";
          if (!link) return;

          const title =
            $el.find(".chapternum, span").first().text().trim() ||
            $el.find("a").first().text().trim();

          const numMatch = title.match(/(\d+(?:\.\d+)?)/);
          const number = numMatch ? parseFloat(numMatch[1]) : idx + 1;

          const date =
            $el.find(".chapterdate, .date, time").first().text().trim() || "";

          const id = link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

          chapters.push({
            id,
            mangaId,
            number,
            title,
            date,
            url: link,
          });
        }
      );

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

      // Check ts_reader.run
      const tsMatch = html.match(/ts_reader\.run\(([\s\S]*?)\);/);
      if (tsMatch) {
        try {
          const parsed = JSON.parse(tsMatch[1]);
          const images = parsed?.sources?.[0]?.images ?? [];
          if (Array.isArray(images) && images.length > 0) {
            const pages: PageItem[] = images.map((url: string, index: number) => ({
              index: index + 1,
              url,
              referer: `${this.baseUrl}/`,
            }));
            return { chapterId, pages };
          }
        } catch {
          // fallback
        }
      }

      const $ = cheerio.load(html);
      const pages: PageItem[] = [];
      let index = 1;

      $("#readerarea img, .reading-content img, #chapter_images img, .entry-content img").each(
        (_, el) => {
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
        }
      );

      return { chapterId, pages };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "pages");
    }
  }
}
