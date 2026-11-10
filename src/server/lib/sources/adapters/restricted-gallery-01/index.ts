import type { SourceCapabilities } from "@/shared/sources/source-capabilities";
import type {
  Chapter,
  ChapterPages,
  FilterList,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  SourceReadOptions,
} from "@/shared/sources/source-types";
import { SourceError } from "../../error";
import { HttpClient } from "../base/http-client";
import {
  chapterGalleryId,
  normalizeGallery,
  normalizeListing,
  numericId,
} from "./normalizer";

const SOURCE_ID = "rcs-01";
const UPSTREAM = "https://nhentai.net";

/**
 * Integration candidate only: never enabled or exposed until separate rights,
 * moderation, age/access-policy and live API review. A disabled registry entry
 * alone is not a security boundary: SourceManager can resolve built-ins by ID.
 * Every network-facing method must therefore reject while disabled.
 */
export class RestrictedGallery01Source implements MangaSource {
  readonly id = SOURCE_ID;
  readonly name = "Restricted Source 01";
  readonly description = "Optional content source under technical review.";
  readonly baseUrl = UPSTREAM;
  readonly upstreamDomain = "nhentai.net";
  readonly version = "0.1.0";
  readonly adapterVersion = "0.1.0";
  readonly language = "multi";
  readonly supportedLanguages = ["en", "ja"];
  readonly isInstalled = true;
  readonly isEnabled = false;
  readonly isNsfw = true;
  readonly isDynamic = false;
  readonly status = "in-dev" as const;
  readonly capabilities: SourceCapabilities = {
    popular: false,
    latest: false,
    search: false,
    detail: false,
    chapters: false,
    pages: false,
    filters: false,
    multiLanguage: false,
    auth: false,
    download: false,
  };

  private readonly client: HttpClient;

  constructor(client?: HttpClient) {
    this.client = client ?? new HttpClient({
      baseUrl: UPSTREAM,
      allowedHosts: ["nhentai.net"],
      timeoutMs: 10_000,
      maxRedirects: 0,
      maxResponseSize: 2 * 1024 * 1024,
      defaultHeaders: { Accept: "application/json" },
    });
  }

  private assertAccess(options?: SourceReadOptions): void {
    if (!this.isEnabled || this.status === "in-dev") {
      throw new SourceError("Source is disabled pending approval", {
        code: "SOURCE_DISABLED",
        sourceId: this.id,
      });
    }
    if (options && options.hideNsfw !== false) {
      throw new SourceError("Content is restricted by preference", {
        code: "CONTENT_RESTRICTED",
        sourceId: this.id,
      });
    }
  }

  private pageNumber(page: number): number {
    if (!Number.isSafeInteger(page) || page < 1 || page > 100) {
      throw new Error("Invalid page number");
    }
    return page;
  }

  private async request<T>(
    path: string,
    stage: "search" | "detail" | "chapters" | "pages",
    params?: Record<string, string | number>
  ): Promise<T> {
    try {
      return await this.client.get<T>(path, params);
    } catch (err) {
      throw SourceError.classify(err, this.id, stage);
    }
  }

  async getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    this.assertAccess(options);
    const current = this.pageNumber(page);
    // Upstream sort semantics remain unverified; do not advertise this capability.
    const raw = await this.request<unknown>(
      "/api/galleries/search", "search",
      { query: "", sort: "popular", page: current }
    );
    return normalizeListing(raw, current);
  }

  async getLatest(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    this.assertAccess(options);
    const current = this.pageNumber(page);
    const raw = await this.request<unknown>("/api/galleries/all", "search", { page: current });
    return normalizeListing(raw, current);
  }

  async search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>,
    options?: SourceReadOptions
  ): Promise<MangaPageResult> {
    this.assertAccess(options);
    if (filters && Object.keys(filters).length) {
      throw new SourceError("Search filters not verified", {
        code: "SCHEMA_CHANGED", sourceId: this.id, stage: "search",
      });
    }
    const trimmed = query.trim();
    if (!trimmed || trimmed.length > 120) {
      throw new Error("Invalid search query");
    }
    const current = this.pageNumber(page);
    const raw = await this.request<unknown>(
      "/api/galleries/search", "search",
      { query: trimmed, page: current }
    );
    return normalizeListing(raw, current);
  }

  private async rawGallery(id: string, stage: "detail" | "chapters" | "pages") {
    const raw = await this.request<unknown>("/api/gallery/" + numericId(id), stage);
    try {
      const gallery = normalizeGallery(raw);
      if (gallery.item.id !== id) throw new Error("SCHEMA_CHANGED: Gallery identity mismatch");
      return gallery;
    } catch (err) {
      throw SourceError.classify(err, this.id, stage);
    }
  }

  async getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail> {
    this.assertAccess(options);
    return (await this.rawGallery(mangaId, "detail")).detail;
  }

  async getChapters(mangaId: string, options?: SourceReadOptions): Promise<Chapter[]> {
    this.assertAccess(options);
    return [(await this.rawGallery(mangaId, "chapters")).chapter];
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    this.assertAccess();
    const id = chapterGalleryId(chapterId);
    const normalized = await this.rawGallery(id, "pages");
    return { chapterId, pages: normalized.pages };
  }

  getFilters(): FilterList {
    // Do not advertise unsupported filters, even while the adapter is disabled.
    return { genres: [], formats: [], statuses: [], sorts: [] };
  }
}
