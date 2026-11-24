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
import type { MangaThemesiaConfig } from "./types";
import { SourceError } from "../../error";
import { sameProviderUrl, normalizeStagedMediaUrl, normalizeStagedPages, stagedDetailIdentity } from "./normalize-catalog";

export class MangaThemesiaEngine extends BaseEngine {
  protected mangaPath: string;
  protected itemSelector: string;
  protected readerAreaSelector: string;

  constructor(config: MangaThemesiaConfig) {
    super(config);
    this.mangaPath = config.mangaPath ?? "/manga";
    this.itemSelector = config.itemSelector ?? ".bsx, .listupd .bs, .animepost";
    this.readerAreaSelector = config.readerAreaSelector ?? "#readerarea";
  }

  protected parseMangaItems($: cheerio.CheerioAPI): MangaItem[] {
    const mangas: MangaItem[] = [];

    $(this.itemSelector).each((_, el) => {
      const $el = $(el);
      const link =
        $el.find("a[href*='/manga/']").attr("href") ||
        $el.find("a").first().attr("href") ||
        "";
      if (!sameProviderUrl(link, this.baseUrl)) return;

      const title =
        $el.find(".tt, .title, h4, h3").text().trim() ||
        $el.find("a").first().attr("title")?.trim() ||
        "";

      const coverUrl =
        $el.find("img").attr("data-src") ||
        $el.find("img").attr("data-lazy-src") ||
        $el.find("img").attr("src") ||
        "";

      const latestChapter =
        $el
          .find(".lsch a, .epxs, .lsch")
          .filter((_, elem) => $(elem).text().trim().length > 0)
          .first()
          .text()
          .trim() || undefined;

      const format =
        $el.find(".typeflag, .type").first().text().trim() || undefined;

      const scoreText =
        $el.find(".rating i, .numscore").first().text().trim() || undefined;
      const score = scoreText ? parseFloat(scoreText) || undefined : undefined;

      // Extract slug from URL: /manga/slug/
      const match = link.match(/\/manga\/([^\/]+)\/?/);
      const id = match ? match[1] : link.replace(this.baseUrl, "").replace(/^\/|\/$/g, "");

      if (id && title) {
        mangas.push({
          id,
          title,
          coverUrl,
          latestChapter,
          format,
          score,
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
    const path = `${this.mangaPath}/?order=popular&page=${p}`;
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
    const path = `${this.mangaPath}/?order=update&page=${p}`;
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
    const path = `/?s=${encodeURIComponent(query)}&page=${p}`;
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

  async getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail> {
    this.enforceContentPolicy("detail", options);

    if (!sameProviderUrl(mangaId, this.baseUrl)) throw new SourceError("Invalid provider identity", { sourceId: this.id, code: "CONTENT_NOT_FOUND" });
    const path = mangaId.startsWith("http")
      ? mangaId
      : `${this.mangaPath}/${encodeURIComponent(mangaId)}/`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);

      const title =
        $("h1.entry-title").first().text().trim() ||
        $(".post-title").first().text().trim() ||
        "";
      if (!title) throw new SourceError("Detail title missing", { sourceId: this.id, code: "PARSER_BROKEN", stage: "detail" });

      const description =
        $(".entry-content.entry-content-single, .entry-content, .synopsis")
          .first()
          .text()
          .trim() || "";

      const coverUrl =
        $(".thumb img").attr("data-src") ||
        $(".thumb img").attr("data-lazy-src") ||
        $(".thumb img").attr("src") ||
        "";

      const genres: string[] = [];
      $(".mgen a, .seriestegenre a, a[rel='tag']").each((_, el) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });

      let status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" = "UNKNOWN";
      const statusText =
        $(".tsinfo .imptdt:contains('Status') i, .infotable tr:contains('Status') td:last-child")
          .text()
          .trim()
          .toLowerCase();
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

    if (!sameProviderUrl(mangaId, this.baseUrl)) throw new SourceError("Invalid provider identity", { sourceId: this.id, code: "CONTENT_NOT_FOUND" });
    const path = mangaId.startsWith("http")
      ? mangaId
      : `${this.mangaPath}/${encodeURIComponent(mangaId)}/`;

    try {
      const html = await this.client.getHtml(path);
      const $ = cheerio.load(html);
      const chapters: Chapter[] = [];

      $("#chapterlist ul li, .clstyle li, .eplister ul li").each((idx, el) => {
        const $el = $(el);
        const link = $el.find("a").first().attr("href") || "";
        if (!sameProviderUrl(link, this.baseUrl)) return;

        const title =
          $el.find(".chapternum").first().text().trim() ||
          $el.find("a").first().text().trim();

        const numAttr = $el.attr("data-num") || "";
        const numMatch = title.match(/(\d+(?:\.\d+)?)/);
        const number = parseFloat(numAttr) || (numMatch ? parseFloat(numMatch[1]) : idx + 1);

        const date =
          $el.find(".chapterdate").first().text().trim() ||
          $el.find(".date").first().text().trim() ||
          "";

        // Id from link path
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

      // AstralScans V8 anti-scraper decryption handler
      if (chapters.length === 0 && this.id === "astral-scans") {
        try {
          const formData = new URLSearchParams();
          formData.append("v8_req", "get_list");
          const v8Res = await this.client.getText(path, undefined, {
            method: "POST",
            headers: { "X-V8-Key": "astral" },
            body: formData.toString(),
          });
          if (v8Res.startsWith("V8_")) {
            const enc1 = v8Res.substring(3);
            const dec1 = Buffer.from(enc1, "base64").toString("binary");
            const rev1 = dec1.split("").reverse().join("");
            const payload = Buffer.from(rev1, "base64").toString("utf-8");
            const parts = payload.split("|||");
            if (parts.length === 2) {
              const $v = cheerio.load(parts[0]);
              const attr = parts[1];
              $v(`[${attr}]`).each((idx, el) => {
                const raw = $v(el).attr(attr);
                if (!raw) return;
                const link = Buffer.from(raw, "base64").toString("utf-8");
                const title = $v(el).text().trim() || `Chapter ${idx + 1}`;
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
                  isLocked: false,
                });
              });
            }
          }
        } catch {
          // Keep existing chapters
        }
      }

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

      // Strategy 1: ts_reader.run JSON payload
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
          // Fall through to HTML selector
        }
      }

      // Strategy 2: HTML selector (#readerarea img)
      const $ = cheerio.load(html);
      const pages: PageItem[] = [];
      let index = 1;

      $(`${this.readerAreaSelector} img`).each((_, el) => {
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

      return normalizeStagedPages(chapterId, pages, path, this.baseUrl, this.id);
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "pages");
    }
  }
}
