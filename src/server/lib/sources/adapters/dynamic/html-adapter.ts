import * as cheerio from "cheerio";
import { MangaSource, MangaPageResult, MangaDetail, Chapter, ChapterPages, SourceMetadata, FilterList, PageItem } from "@/shared/sources/source-types";
import type { CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import { safeFetch } from "@/server/lib/security/outbound-policy";

export class DynamicHtmlSourceAdapter implements MangaSource {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly language?: string;
  public baseUrl: string;
  public readonly version?: string;
  public readonly isEnabled: boolean;
  public readonly isInstalled: boolean = true;
  public readonly capabilities: SourceMetadata["capabilities"];
  public readonly isNsfw: boolean;
  public readonly isDynamic: boolean = true;

  private definition: CustomSourceDefinition;

  constructor(definition: CustomSourceDefinition) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.language = definition.lang;
    this.baseUrl = definition.baseUrl;
    this.version = definition.version;
    this.isEnabled = definition.isEnabled;
    this.isNsfw = definition.isNsfw;
    this.capabilities = {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
    };
  }

  public setBaseUrl(newUrl: string) {
    this.baseUrl = newUrl;
  }

  private async fetchHtml(urlPath: string): Promise<cheerio.CheerioAPI> {
    const fullUrl = urlPath.startsWith("http")
      ? urlPath
      : `${this.baseUrl.replace(/\/$/, "")}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;

    const res = await safeFetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Gagal memuat URL ${fullUrl}: HTTP ${res.status}`);
    }

    const html = await res.text();
    return cheerio.load(html);
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const selectors = this.definition.selectors;
    const popularPath = selectors?.popularPath || "/";
    const pathWithPage = popularPath.includes("{page}")
      ? popularPath.replace("{page}", String(page))
      : popularPath;

    const $ = await this.fetchHtml(pathWithPage);
    const mangas: any[] = [];

    if (selectors) {
      $(selectors.popularListSelector).each((_, el) => {
        const $el = $(el);
        const title = $el.find(selectors.titleSelector).first().text().trim() ||
                      $el.find(selectors.titleSelector).first().attr("title")?.trim() || "";
        let coverUrl = $el.find(selectors.coverSelector).first().attr("src") ||
                       $el.find(selectors.coverSelector).first().attr("data-src") || "";
        if (coverUrl.startsWith("//")) coverUrl = `https:${coverUrl}`;

        const link = $el.find(selectors.linkSelector).first().attr("href") || "";
        const id = link.replace(this.baseUrl, "").replace(/^\/+/, "").replace(/\/+$/, "") || link;

        if (title && id) {
          mangas.push({ id, title, coverUrl });
        }
      });
    }

    return {
      mangas,
      hasNextPage: mangas.length > 0,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    return this.getPopular(page);
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    const searchPath = `/?s=${encodeURIComponent(query)}`;
    const $ = await this.fetchHtml(searchPath);
    const selectors = this.definition.selectors;
    const mangas: any[] = [];

    if (selectors) {
      $(selectors.popularListSelector).each((_, el) => {
        const $el = $(el);
        const title = $el.find(selectors.titleSelector).first().text().trim();
        const coverUrl = $el.find(selectors.coverSelector).first().attr("src") || "";
        const link = $el.find(selectors.linkSelector).first().attr("href") || "";
        const id = link.replace(this.baseUrl, "").replace(/^\/+/, "").replace(/\/+$/, "") || link;
        if (title && id) {
          mangas.push({ id, title, coverUrl });
        }
      });
    }

    return {
      mangas,
      hasNextPage: false,
    };
  }

  async getDetail(id: string): Promise<MangaDetail> {
    const $ = await this.fetchHtml(`/${id}`);
    const selectors = this.definition.selectors;

    const title = selectors ? $(selectors.titleSelector).first().text().trim() : id;
    const coverUrl = selectors ? $(selectors.coverSelector).first().attr("src") || "" : "";
    const description = selectors?.synopsisSelector ? $(selectors.synopsisSelector).text().trim() : "";

    return {
      id,
      title: title || id,
      coverUrl,
      description,
      genres: [],
      status: "ONGOING",
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const $ = await this.fetchHtml(`/${mangaId}`);
    const selectors = this.definition.selectors;
    const chapters: Chapter[] = [];

    if (selectors?.chapterListSelector) {
      $(selectors.chapterListSelector).each((idx, el) => {
        const $el = $(el);
        const title = selectors.chapterTitleSelector ? $el.find(selectors.chapterTitleSelector).text().trim() : $el.text().trim();
        const link = selectors.chapterLinkSelector ? $el.find(selectors.chapterLinkSelector).attr("href") : $el.attr("href");
        const id = (link || "").replace(this.baseUrl, "").replace(/^\/+/, "").replace(/\/+$/, "") || `ch-${idx + 1}`;

        if (title) {
          chapters.push({
            id,
            mangaId,
            title,
            number: idx + 1,
            date: "Baru saja",
          });
        }
      });
    }

    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const $ = await this.fetchHtml(`/${chapterId}`);
    const selectors = this.definition.selectors;
    const pages: PageItem[] = [];

    if (selectors?.pagesSelector) {
      let idx = 0;
      $(selectors.pagesSelector).each((_, el) => {
        let src = $(el).attr("src") || $(el).attr("data-src") || "";
        if (src.startsWith("//")) src = `https:${src}`;
        if (src) {
          pages.push({
            index: idx++,
            url: src,
            referer: this.baseUrl,
          });
        }
      });
    }

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
