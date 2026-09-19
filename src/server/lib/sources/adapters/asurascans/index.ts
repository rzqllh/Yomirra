import type {
  Chapter,
  ChapterPages,
  FilterList,
  MangaDetail,
  MangaPageResult,
  MangaSource,
} from "@/shared/sources/source-types";
import type { SourceCapabilities } from "@/shared/sources/source-capabilities";
import { HttpClient } from "../base/http-client";
import {
  normalizeAsuraChapter,
  normalizeAsuraMangaDetail,
  normalizeAsuraMangaItem,
  normalizeAsuraPages,
  parseAsuraChapterId,
} from "./normalizer";
import type {
  AsuraChapterReadResponse,
  AsuraChaptersResponse,
  AsuraGenresResponse,
  AsuraSeriesDetailResponse,
  AsuraSeriesListResponse,
} from "./types";

export class AsuraScansSource implements MangaSource {
  public readonly id = "asurascans";
  public readonly name = "Asura Scans";
  public readonly description = "Official English manhwa & manhua scans with direct JSON API";
  public readonly language = "en";
  public readonly baseUrl = "https://api.asurascans.com/api";
  public readonly upstreamDomain = "api.asurascans.com";
  public readonly supportedLanguages = ["en"];
  public readonly version = "1.0.0";
  public readonly adapterVersion = "1.0.0";
  public readonly isEnabled = true;
  public readonly isInstalled = true;
  public readonly isNsfw = false;
  public readonly isDynamic = false;
  public readonly status = "online" as const;

  public readonly capabilities: SourceCapabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
    filters: true,
    multiLanguage: false,
    auth: false,
    related: false,
    download: true,
  };

  private client: HttpClient;

  constructor(client?: HttpClient) {
    this.client =
      client ??
      new HttpClient({
        baseUrl: this.baseUrl,
        timeoutMs: 15000,
        allowedHosts: ["api.asurascans.com"],
        defaultHeaders: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const res = await this.client.get<AsuraSeriesListResponse>("/series", {
      page: pageNum,
      order: "popular",
    });

    const items = Array.isArray(res?.data) ? res.data : [];
    const hasNextPage = Boolean(res?.meta?.has_more);

    return {
      mangas: items.map(normalizeAsuraMangaItem),
      hasNextPage,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const res = await this.client.get<AsuraSeriesListResponse>("/series", {
      page: pageNum,
      order: "update",
    });

    const items = Array.isArray(res?.data) ? res.data : [];
    const hasNextPage = Boolean(res?.meta?.has_more);

    return {
      mangas: items.map(normalizeAsuraMangaItem),
      hasNextPage,
    };
  }

  async search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    const trimmedQuery = query?.trim() || "";
    const pageNum = Math.max(1, page || 1);

    const params: Record<string, string | number | boolean | string[]> = {
      page: pageNum,
    };

    if (trimmedQuery.length > 0) {
      params.search = trimmedQuery;
    }

    if (filters) {
      if (typeof filters.genres === "string" && filters.genres !== "all") {
        params.genres = filters.genres;
      }
      if (typeof filters.status === "string" && filters.status !== "all") {
        params.status = filters.status;
      }
      if (typeof filters.type === "string" && filters.type !== "all") {
        params.type = filters.type;
      }
      if (typeof filters.sort === "string" && filters.sort !== "all") {
        params.order = filters.sort;
      }
    }

    const res = await this.client.get<AsuraSeriesListResponse>("/series", params);
    const items = Array.isArray(res?.data) ? res.data : [];
    const hasNextPage = Boolean(res?.meta?.has_more);

    return {
      mangas: items.map(normalizeAsuraMangaItem),
      hasNextPage,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error(`INVALID_MANGA_ID: Asura Scans requires a series slug, got "${mangaId}"`);
    }

    const res = await this.client.get<AsuraSeriesDetailResponse>(
      `/series/${encodeURIComponent(slug)}`
    );

    if (!res || !res.series || !res.series.title) {
      throw new Error(`Asura Scans: Manga "${mangaId}" not found`);
    }

    return normalizeAsuraMangaDetail(res.series);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error(`INVALID_MANGA_ID: Asura Scans requires a series slug, got "${mangaId}"`);
    }

    const res = await this.client.get<AsuraChaptersResponse>(
      `/series/${encodeURIComponent(slug)}/chapters`
    );

    if (!res || !Array.isArray(res.data)) {
      return [];
    }

    return res.data.map((c) => normalizeAsuraChapter(c, slug));
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const { seriesSlug, chapterParam } = parseAsuraChapterId(chapterId);

    if (!seriesSlug || !chapterParam) {
      throw new Error(
        `INVALID_CHAPTER_ID: Asura Scans chapter ID must be in format "{seriesSlug}::{chapterParam}", got "${chapterId}"`
      );
    }

    const res = await this.client.get<AsuraChapterReadResponse>(
      `/series/${encodeURIComponent(seriesSlug)}/chapters/${encodeURIComponent(chapterParam)}`
    );

    if (!res || !res.data) {
      throw new Error(`Asura Scans: No chapter data found for "${chapterId}"`);
    }

    // Normalizer enforces locked content boundary: locked chapter returns pages: []
    return normalizeAsuraPages(res, chapterId);
  }

  async getFilters(): Promise<FilterList> {
    let genres: { id: string; name: string }[] = [];
    try {
      const res = await this.client.get<AsuraGenresResponse>("/genres");
      if (Array.isArray(res?.data)) {
        genres = res.data.map((g) => ({
          id: g.slug,
          name: g.name,
        }));
      }
    } catch {
      // Fallback if genres endpoint temporarily fails
      genres = [];
    }

    return {
      genres,
      formats: [
        { id: "all", name: "All Types" },
        { id: "manhwa", name: "Manhwa" },
        { id: "manga", name: "Manga" },
        { id: "manhua", name: "Manhua" },
      ],
      statuses: [
        { id: "all", name: "All Status" },
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
        { id: "hiatus", name: "Hiatus" },
      ],
      sorts: [
        { id: "popular", name: "Popular" },
        { id: "update", name: "Latest Update" },
      ],
    };
  }
}
