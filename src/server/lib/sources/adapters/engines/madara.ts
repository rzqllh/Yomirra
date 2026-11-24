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
import type { MadaraConfig } from "./types";
import { SourceError } from "../../error";
import { sameProviderUrl, normalizeStagedMediaUrl } from "./normalize-catalog";

export class MadaraEngine extends BaseEngine {
  protected itemSelector: string;

  constructor(config: MadaraConfig) {
    super(config);
    this.itemSelector =
      config.itemSelector ??
      ".c-tabs-item__content, .page-item-detail, .badge-pos-1, .manga";
  }

  protected parseMangaItems($: cheerio.CheerioAPI): MangaItem[] {
    const mangas: MangaItem[] = [];

    $(this.itemSelector).each((_, el) => {
      const $el = $(el);
      const link =
        $el.find(".post-title a, h3 a, h4 a").first().attr("href") ||
        $el.find("a").first().attr("href") ||
        "";
      if (!sameProviderUrl(link, this.baseUrl)) return;

      const title =
        $el.find(".post-title a, h3 a, h4 a").first().text().trim() ||
        $el.find("a").first().attr("title")?.trim() ||
        "";

      const coverUrl =
        $el.find("img").attr("data-src") ||
        $el.find("img").attr("data-lazy-src") ||
        $el.find("img").attr("src") ||
        "";

      const latestChapter =
        $el.find(".chapter a, .list-chapter .chapter-item a").first().text().trim() ||
        undefined;

      const match = link.match(/\/manga\/([^\/]+)\/?/);
      const id = match ? match[1] : link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

      if (id && title) {
        mangas.push({
          id,
          title,
          coverUrl,
          latestChapter,
          isNsfw: this.isNsfw,
          contentRating: this.isNsfw ? "pornographic" : "unknown",
        });
      }
    });

    return mangas;
  }

  async getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    if (this.isNsfw && options?.hideNsfw !== false) {
      return { mangas: [], hasNextPage: false };
    }

    const p = Math.max(1, page || 1);
    const path = `/manga/?m_orderby=views&paged=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".nav-previous, .pagination .next, a.next").length > 0;
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
    const path = `/manga/?m_orderby=latest&paged=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".nav-previous, .pagination .next, a.next").length > 0;
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
    const path = `/?s=${encodeURIComponent(query)}&post_type=wp-manga&paged=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".nav-previous, .pagination .next, a.next").length > 0;
      return this.filterListingResults({ mangas, hasNextPage }, options);
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail> {
    this.enforceContentPolicy("detail", options);

    if (!sameProviderUrl(mangaId, this.baseUrl)) throw new SourceError("Invalid provider identity", { sourceId: this.id, code: "CONTENT_NOT_FOUND" });
    const path = mangaId.startsWith("http")
      ? mangaId
      : `/manga/${encodeURIComponent(mangaId)}/`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);

      const title =
        $(".post-title h1, h1.entry-title").first().text().trim() || "";
      if (!title) throw new SourceError("Detail title missing", { sourceId: this.id, code: "PARSER_BROKEN", stage: "detail" });

      const description =
        $(".description-summary, .summary__content, .manga-excerpt")
          .first()
          .text()
          .trim() || "";

      const coverUrl =
        $(".summary_image img").attr("data-src") ||
        $(".summary_image img").attr("data-lazy-src") ||
        $(".summary_image img").attr("src") ||
        "";

      const genres: string[] = [];
      $(".genres-content a").each((_, el) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });

      let status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" = "UNKNOWN";
      const statusText = $(".post-status .summary-content").text().toLowerCase();
      if (statusText.includes("ongoing") || statusText.includes("berjalan")) status = "ONGOING";
      else if (statusText.includes("completed") || statusText.includes("tamat")) status = "COMPLETED";

      const author =
        $(".author-content a, .artist-content a").first().text().trim() || undefined;

      return {
        id: mangaId,
        title,
        coverUrl: normalizeStagedMediaUrl(coverUrl, this.baseUrl),
        description,
        genres,
        status,
        author,
        isNsfw: this.isNsfw,
        contentRating: this.isNsfw ? "pornographic" : "unknown",
      };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "detail");
    }
  }

  async getChapters(mangaId: string, options?: SourceReadOptions): Promise<Chapter[]> {
    this.enforceContentPolicy("chapters", options);

    if (!sameProviderUrl(mangaId, this.baseUrl)) throw new SourceError("Invalid provider identity", { sourceId: this.id, code: "CONTENT_NOT_FOUND" });
    const path = mangaId.startsWith("http")
      ? mangaId
      : `/manga/${encodeURIComponent(mangaId)}/`;

    try {
      let html = await this.client.getHtml(path);
      let $ = cheerio.load(html);

      // Check if chapters are loaded via ajax in Madara
      if ($("li.wp-manga-chapter").length === 0) {
        try {
          const ajaxHtml = await this.client.getText(
            `${path}ajax/chapters/`,
            undefined,
            { method: "POST" }
          );
          if (ajaxHtml) {
            html = ajaxHtml;
            $ = cheerio.load(html);
          }
        } catch {
          // keep original html
        }
      }

      const chapters: Chapter[] = [];
      $("li.wp-manga-chapter").each((idx, el) => {
        const $el = $(el);
        const link = $el.find("a").first().attr("href") || "";
        if (!sameProviderUrl(link, this.baseUrl)) return;

        const title = $el.find("a").first().text().trim();
        const numMatch = title.match(/(\d+(?:\.\d+)?)/);
        const number = numMatch ? parseFloat(numMatch[1]) : idx + 1;

        const date =
          $el.find(".chapter-release-date").first().text().trim() || "";

        const id = link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

        const isLocked =
          $el.hasClass("locked") ||
          $el.hasClass("has-lock") ||
          $el.hasClass("premium") ||
          $el.find(".lock, .fa-lock, .svg-inline--fa-lock, .icon-lock, .badge-locked, .coin-locked, .premium").length > 0;

        chapters.push({
          id,
          mangaId,
          number,
          title,
          date,
          url: link,
          isLocked,
        });
      });

      return chapters;
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "chapters");
    }
  }

  async getPages(chapterId: string, options?: SourceReadOptions): Promise<ChapterPages> {
    this.enforceContentPolicy("pages", options);

    if (!sameProviderUrl(chapterId, this.baseUrl)) throw new SourceError("Invalid provider chapter identity", { sourceId: this.id, code: "CONTENT_NOT_FOUND", stage: "pages" });
    const path = chapterId.startsWith("http")
      ? chapterId
      : `/${chapterId.replace(/^\/+/, "")}`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const pages: PageItem[] = [];
      let index = 1;

      $(".reading-content img, .page-break img").each((_, el) => {
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
