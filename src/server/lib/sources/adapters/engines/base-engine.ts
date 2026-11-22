import type {
  Chapter,
  ChapterPages,
  FilterList,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  SourceHealthStage,
  SourceReadOptions,
} from "@/shared/sources/source-types";
import type { SourceCapabilities } from "@/shared/sources/source-capabilities";
import { HttpClient } from "../base/http-client";
import { SourceError } from "../../error";
import type { BaseEngineConfig, SourceCategory } from "./types";

const ADULT_KEYWORDS = [
  "hentai",
  "doujin",
  "doujinshi",
  "ecchi",
  "nsfw",
  "18+",
  "adult",
  "eromanga",
  "smut",
  "porno",
  "yaoi",
  "yuri",
];

export abstract class BaseEngine implements MangaSource {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly language: string;
  public baseUrl: string;
  public readonly upstreamDomain: string;
  public readonly category: SourceCategory;
  public readonly isNsfw: boolean;
  public readonly icon?: string;
  public readonly version: string;
  public readonly adapterVersion: string;
  public readonly supportedLanguages: string[];

  // Strict rollout constraint: all ported Keiyoushi sources are disabled and in-dev by default
  public readonly isEnabled = false;
  public readonly isInstalled = true;
  public readonly isDynamic = false;
  public readonly status = "in-dev" as const;

  public readonly capabilities: SourceCapabilities;

  protected client: HttpClient;

  constructor(config: BaseEngineConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description ?? `${config.name} catalog adapter`;
    this.language = config.language ?? "id";
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.upstreamDomain =
      config.upstreamDomain ??
      (() => {
        try {
          return new URL(this.baseUrl).hostname;
        } catch {
          return "";
        }
      })();
    this.category = config.category;
    this.isNsfw = config.isNsfw;
    this.icon = config.icon ?? `https://s2.googleusercontent.com/s2/favicons?domain=${this.upstreamDomain}&sz=64`;
    this.version = config.version ?? "1.0.0";
    this.adapterVersion = config.adapterVersion ?? "1.0.0";
    this.supportedLanguages = config.supportedLanguages ?? [this.language];

    // Capabilities enforce download: false by default
    this.capabilities = {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
      multiLanguage: this.supportedLanguages.length > 1,
      auth: false,
      related: false,
      download: false,
      ...(config.capabilities ?? {}),
    };

    this.client = new HttpClient(this.baseUrl, {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Referer: `${this.baseUrl}/`,
    });
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, "");
    this.client.setBaseUrl(this.baseUrl);
  }

  /**
   * Safe-mode check for content access (detail, chapters, reader pages).
   * Throws CONTENT_RESTRICTED if safe-mode is active (hideNsfw !== false).
   */
  protected enforceContentPolicy(stage: SourceHealthStage, options?: SourceReadOptions): void {
    if (this.isNsfw && options?.hideNsfw !== false) {
      throw new SourceError("CONTENT_POLICY_RESTRICTED", {
        code: "CONTENT_RESTRICTED",
        sourceId: this.id,
        stage,
        statusCode: 403,
      });
    }
  }

  /**
   * Applies server-side filtering for listing results (popular, latest, search).
   * For NSFW sources: returns empty result when safe-mode is active.
   * For MIXED sources: filters out titles containing explicit adult keywords.
   */
  protected filterListingResults(
    results: MangaPageResult,
    options?: SourceReadOptions
  ): MangaPageResult {
    if (this.isNsfw) {
      if (options?.hideNsfw !== false) {
        return { mangas: [], hasNextPage: false };
      }
      return results;
    }

    if (this.category === "MIXED" && options?.hideNsfw !== false) {
      const filtered = results.mangas.filter((m) => {
        const titleLower = (m.title || "").toLowerCase();
        const descLower = (m.description || "").toLowerCase();
        const hasAdult = ADULT_KEYWORDS.some(
          (kw) => titleLower.includes(kw) || descLower.includes(kw)
        );
        return !hasAdult;
      });
      return { mangas: filtered, hasNextPage: results.hasNextPage };
    }

    return results;
  }

  abstract getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult>;
  abstract getLatest(page: number, options?: SourceReadOptions): Promise<MangaPageResult>;
  abstract search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>,
    options?: SourceReadOptions
  ): Promise<MangaPageResult>;
  abstract getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail>;
  abstract getChapters(mangaId: string, options?: SourceReadOptions): Promise<Chapter[]>;
  abstract getPages(chapterId: string, options?: SourceReadOptions): Promise<ChapterPages>;

  public getFilters(): FilterList | Promise<FilterList> {
    return {
      genres: [],
      formats: [],
      statuses: [],
      sorts: [],
    };
  }
}
