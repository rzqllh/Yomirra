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
import type { NatsuIdConfig } from "./types";
import { SourceError } from "../../error";
import { sameProviderUrl, normalizeStagedMediaUrl, normalizeStagedChapters, stagedChapterLock, normalizeStagedPages, stagedDetailIdentity } from "./normalize-catalog";

export class NatsuIdEngine extends BaseEngine {
  protected searchAction: string;
  protected chapterAction: string;

  constructor(config: NatsuIdConfig) {
    super(config);
    this.searchAction = config.searchAction ?? "advanced_search";
    this.chapterAction = config.chapterAction ?? "chapter_list";
  }

  protected parseMangaItems($: cheerio.CheerioAPI): MangaItem[] {
    const mangas: MangaItem[] = [];

    $(".listupd .bs, .list-update .bs, .animepost, .bsx, #search-results > div, div[id*='search-results'] > div").each((_, el) => {
      const $el = $(el);
      const link =
        $el.find("a[href*='/manga/']").attr("href") ||
        $el.find("a").first().attr("href") ||
        "";
      if (!sameProviderUrl(link, this.baseUrl) || link.includes("/chapter-")) return;

      const title =
        $el.find(".tt, .title, h4, h3, h1, a[href*='/manga/'] h1, a[href*='/manga/'] h2").first().text().trim() ||
        $el.find("a").first().attr("title")?.trim() ||
        $el.find("img[alt]").attr("alt")?.trim() ||
        "";

      const coverUrl =
        $el.find("img").attr("data-src") ||
        $el.find("img").attr("data-lazy-src") ||
        $el.find("img").attr("src") ||
        "";

      const latestChapter =
        $el
          .find(".lsch a, .epxs, .lsch, a[href*='/chapter-'] p, a[href*='/chapter-'] div")
          .filter((_, elem) => $(elem).text().trim().length > 0)
          .first()
          .text()
          .trim() || undefined;

      const format =
        $el.find(".typeflag, .type").first().text().trim() || undefined;

      const match = link.match(/\/manga\/([^\/]+)\/?/);
      const id = match ? match[1] : link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

      if (id && title) {
        mangas.push({
          id,
          title,
          coverUrl,
          latestChapter,
          format,
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
    const path = `/manga/?order=popular&page=${p}`;
    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".hpage a.r, .pagination .next, a.next").length > 0;
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
      const hasNextPage = $(".hpage a.r, .pagination .next, a.next").length > 0;
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
    try {
      let html: string;
      try {
        // Try admin-ajax advanced search
        const body = `action=${encodeURIComponent(this.searchAction)}&query=${encodeURIComponent(query)}&page=${p}`;
        html = await this.client.getText("/wp-admin/admin-ajax.php", undefined, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
      } catch {
        // Fallback to standard WP query
        html = await this.client.getHtml(`/?s=${encodeURIComponent(query)}&page=${p}`);
      }

      const $ = cheerio.load(html);
      const mangas = this.parseMangaItems($);
      const hasNextPage = $(".hpage a.r, .pagination .next, a.next").length > 0;
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
        $("h1.entry-title, .post-title, h1").first().text().trim() || "";
      if (!title) throw new SourceError("Detail title missing", { sourceId: this.id, code: "PARSER_BROKEN", stage: "detail" });

      const description =
        $(".entry-content, .synopsis, .summary__content").first().text().trim() || "";

      const coverUrl =
        $(".thumb img, .poster img").attr("data-src") ||
        $(".thumb img, .poster img").attr("data-lazy-src") ||
        $(".thumb img, .poster img").attr("src") ||
        "";

      const genres: string[] = [];
      $(".mgen a, .seriestegenre a, a[rel='tag']").each((_, el) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });

      let status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" = "UNKNOWN";
      const statusText = $(".tsinfo .imptdt:contains('Status') i, .infotable").text().toLowerCase();
      if (statusText.includes("ongoing") || statusText.includes("berjalan")) status = "ONGOING";
      else if (statusText.includes("completed") || statusText.includes("tamat")) status = "COMPLETED";

      const author =
        $(".tsinfo .imptdt:contains('Author') i, .infotable tr:contains('Author') td:last-child")
          .text()
          .trim() || undefined;

      return {
        id: mangaId,
        title,
        ...stagedDetailIdentity($),
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

    if (!sameProviderUrl(mangaId, this.baseUrl)) {
      throw new SourceError("Invalid provider identity", {
        sourceId: this.id,
        code: "CONTENT_NOT_FOUND",
        stage: "chapters",
      });
    }
    const detailPath = mangaId.startsWith("http")
      ? mangaId
      : `/manga/${encodeURIComponent(mangaId)}/`;

    try {
      let html = await this.client.getHtml(detailPath);
      let $ = cheerio.load(html);

      // If no chapters found on detail page, attempt admin-ajax fallback
      if ($("a[href*='/chapter-'], a[href*='/ch-'], #chapterlist li a, .chapter-list li a").length === 0) {
        try {
          const ajaxHtml = await this.client.getHtml(
            `/wp-admin/admin-ajax.php?action=${encodeURIComponent(this.chapterAction)}&manga_id=${encodeURIComponent(mangaId)}`
          );
          if (ajaxHtml && ajaxHtml.length > 50) {
            html = ajaxHtml;
            $ = cheerio.load(html);
          }
        } catch {
          // Keep original html
        }
      }
      const chapters: Chapter[] = [];

      $("a[href*='/chapter-'], a[href*='/ch-'], #chapterlist li a, .chapter-list li a").each(
        (idx, el) => {
          const $el = $(el);
          const link = $el.attr("href") || "";
          if (!sameProviderUrl(link, this.baseUrl)) return;

          const title =
            $el.find(".chapternum, span").first().text().trim() || $el.text().trim();

          const numMatch = title.match(/(\d+(?:\.\d+)?)/);
          const number = numMatch ? parseFloat(numMatch[1]) : idx + 1;

          const date =
            $el.find("time").attr("datetime") ||
            $el.find(".chapterdate, .date").text().trim() ||
            "";

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
            isLocked: stagedChapterLock(isLocked || $el.closest("li").is(".locked,.has-lock,.premium"), $el.attr("data-locked"), $el.closest("li").attr("data-locked")),
          });
        }
      );

      return normalizeStagedChapters(chapters, mangaId, this.baseUrl, this.id);
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

      // 1. Check data-image-data or JSON payload
      const dataImgMatch = html.match(/data-image-data=['"]([^'"]+)['"]/);
      if (dataImgMatch) {
        try {
          const parsed = JSON.parse(dataImgMatch[1]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const pages: PageItem[] = parsed.map((url: string, index: number) => ({
              index: index + 1,
              url,
              referer: `${this.baseUrl}/`,
            }));
            return normalizeStagedPages(chapterId, pages, path, this.baseUrl, this.id);
          }
        } catch (error) {
          if (SourceError.isSourceError(error)) throw error;
          // fallback
        }
      }

      // 2. Check ts_reader.run
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
            return normalizeStagedPages(chapterId, pages, path, this.baseUrl, this.id);
          }
        } catch (error) {
          if (SourceError.isSourceError(error)) throw error;
          // fallback
        }
      }

      // 3. Fallback to HTML selectors
      const $ = cheerio.load(html);
      const pages: PageItem[] = [];
      let index = 1;

      $("#readerarea img, [data-image-data] img, .reading-content img, .reader-area img").each((_, el) => {
        const $img = $(el);
        const url =
          $img.attr("data-src") ||
          $img.attr("data-lazy-src") ||
          $img.attr("src") ||
          "";

        if (
          url &&
          !url.includes("data:image/svg") &&
          !url.includes("placeholder") &&
          !url.includes("logo") &&
          !url.includes("banner") &&
          !url.endsWith(".gif")
        ) {
          pages.push({
            index: index++,
            url: url.trim(),
            referer: `${this.baseUrl}/`,
          });
        }
      });

      return normalizeStagedPages(chapterId, pages, path, this.baseUrl, this.id);
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "pages");
    }
  }
}
