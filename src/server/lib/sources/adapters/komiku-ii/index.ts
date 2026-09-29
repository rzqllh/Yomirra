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
  buildKomikuIIMangaId,
  normalizeKomikuIIChapter,
  normalizeKomikuIIMangaDetail,
  normalizeKomikuIIMangaItem,
  normalizeKomikuIIPages,
  parseKomikuIIChapterId,
  parseKomikuIIMangaId,
} from "./normalizer";
import type {
  KomikuIIChapterItem,
  KomikuIIChapterPagesResponse,
  KomikuIIComicsListResponse,
  KomikuIIDetail,
  KomikuIIFiltersResponse,
  KomikuIIItem,
} from "./types";

export class KomikuIISource implements MangaSource {
  public readonly id = "komiku-ii";
  public readonly name = "Komiku II";
  public readonly description = "REST API komik Bahasa Indonesia";
  public readonly language = "id";
  public readonly baseUrl = "https://01.komiku.asia";
  public readonly healthCheckUrl = "https://01.komiku.asia/api/v2/comics?page=1";
  public readonly icon = "https://s2.googleusercontent.com/s2/favicons?domain=01.komiku.asia&sz=64";
  public readonly version = "1.0.0";
  public readonly adapterVersion = "1.0.0";
  public readonly upstreamDomain = "01.komiku.asia";
  public readonly isEnabled = true;
  public readonly isInstalled = true;
  public readonly status = "online" as const;
  public readonly isNsfw = false;
  public readonly isDynamic = false;

  public readonly capabilities: SourceCapabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
    filters: true,
  };

  private client = new HttpClient({
    baseUrl: "https://01.komiku.asia/api/v2",
    defaultHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    timeoutMs: 10000,
    allowedHosts: ["01.komiku.asia"],
  });

  async getPopular(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const res = await this.client.get<KomikuIIComicsListResponse>("/comics", {
      page: pageNum,
    });

    const items = Array.isArray(res?.items) ? res.items : [];
    const hasNextPage = typeof res?.totalPages === "number" ? pageNum < res.totalPages : items.length >= 12;

    return {
      mangas: items.map(normalizeKomikuIIMangaItem),
      hasNextPage,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const res = await this.client.get<KomikuIIComicsListResponse>("/comics", {
      page: pageNum,
    });

    const items = Array.isArray(res?.items) ? res.items : [];
    const hasNextPage = typeof res?.totalPages === "number" ? pageNum < res.totalPages : items.length >= 12;

    return {
      mangas: items.map(normalizeKomikuIIMangaItem),
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
    const values = (value?: string | string[]) =>
      (Array.isArray(value) ? value : value ? [value] : [])
        .map((item) => item.trim())
        .filter((item) => item && item.toLowerCase() !== "semua");

    const requestedGenres = values(filters?.["genre[]"] ?? filters?.genres);
    const includedGenres = requestedGenres.filter((genre) => !genre.startsWith("-"));
    const excludedGenres = requestedGenres
      .filter((genre) => genre.startsWith("-"))
      .map((genre) => genre.slice(1));
    const requestedFormats = values(filters?.["format[]"] ?? filters?.type);
    const requestedStatuses = values(filters?.status);
    const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

    const applyFilters = (items: KomikuIIItem[]) =>
      items.filter((item) => {
        const itemGenres = (item.genres ?? []).map(normalize);
        const matchesGenres =
          includedGenres.map(normalize).every((genre) => itemGenres.includes(genre)) &&
          excludedGenres.map(normalize).every((genre) => !itemGenres.includes(genre));
        const matchesFormat =
          requestedFormats.length === 0 ||
          requestedFormats.map(normalize).includes(normalize(item.type));
        const matchesStatus =
          requestedStatuses.length === 0 ||
          requestedStatuses.map(normalize).includes(normalize(item.status));
        return matchesGenres && matchesFormat && matchesStatus;
      });

    if (trimmedQuery.length > 0) {
      if (pageNum > 1) {
        return { mangas: [], hasNextPage: false };
      }

      const res = await this.client.get<KomikuIIItem[]>("/comics/search", {
        q: trimmedQuery,
      });

      const items = applyFilters(Array.isArray(res) ? res : []);
      return {
        mangas: items.map(normalizeKomikuIIMangaItem),
        hasNextPage: false,
      };
    }

    const params: Record<string, string | number | boolean | string[]> = {
      page: pageNum,
    };
    if (requestedFormats.length === 1) params.type = requestedFormats[0];
    if (requestedStatuses.length === 1) params.status = requestedStatuses[0];

    const res = await this.client.get<KomikuIIComicsListResponse>("/comics", params);
    const rawItems = Array.isArray(res?.items) ? res.items : [];
    const items = applyFilters(rawItems);
    const hasNextPage =
      typeof res?.totalPages === "number"
        ? pageNum < res.totalPages
        : rawItems.length >= 12;

    return {
      mangas: items.map(normalizeKomikuIIMangaItem),
      hasNextPage,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const { slug, comicId } = parseKomikuIIMangaId(mangaId);
    const targetSlug = slug;
    if (!targetSlug && comicId) {
      throw new Error(`INVALID_MANGA_ID: Komiku II requires a slug to resolve manga detail, got "${mangaId}"`);
    }

    const detail = await this.client.get<KomikuIIDetail>(`/comics/${encodeURIComponent(targetSlug)}`);

    if (!detail || !detail.title) {
      throw new Error(`Komiku II: Manga "${mangaId}" not found`);
    }

    return normalizeKomikuIIMangaDetail(detail);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const parsed = parseKomikuIIMangaId(mangaId);
    let comicId = parsed.comicId;

    // Fallback: If only slug was provided in mangaId, resolve detail first to obtain numeric comicId
    if (!comicId) {
      const detail = await this.getDetail(mangaId);
      const reParsed = parseKomikuIIMangaId(detail.id);
      comicId = reParsed.comicId;
    }

    if (!comicId) {
      throw new Error(`INVALID_MANGA_ID: Unable to resolve numeric comicId for "${mangaId}"`);
    }

    const chapters = await this.client.get<KomikuIIChapterItem[]>(`/comics/${comicId}/chapters`);

    if (!Array.isArray(chapters)) {
      return [];
    }

    const canonicalMangaId = parsed.slug ? buildKomikuIIMangaId(comicId, parsed.slug) : mangaId;

    return chapters.map((c) => normalizeKomikuIIChapter(c, comicId!, canonicalMangaId));
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const { comicId, chapterId: cId } = parseKomikuIIChapterId(chapterId);

    const res = await this.client.get<KomikuIIChapterPagesResponse>(
      `/comics/${comicId}/chapters/id/${cId}`
    );

    if (!res || !Array.isArray(res.pages)) {
      throw new Error(`Komiku II: No pages found for chapter "${chapterId}"`);
    }

    return normalizeKomikuIIPages(res, chapterId, `${this.baseUrl}/`);
  }

  async getFilters(): Promise<FilterList> {
    try {
      const res = await this.client.get<KomikuIIFiltersResponse>("/comics/filters");

      const genres = Array.isArray(res?.genres)
        ? res.genres.map((g) => ({ id: g, name: g }))
        : [];
      const statuses = Array.isArray(res?.statuses)
        ? res.statuses.filter((s) => s !== "Semua").map((s) => ({ id: s, name: s }))
        : [];
      const formats = Array.isArray(res?.types)
        ? res.types.filter((t) => t !== "Semua").map((t) => ({ id: t, name: t }))
        : [];

      return {
        genres,
        statuses,
        formats,
        sorts: [],
      };
    } catch {
      // Resilient fallback with known categories
      return {
        genres: [
          { id: "Action", name: "Action" },
          { id: "Adventure", name: "Adventure" },
          { id: "Comedy", name: "Comedy" },
          { id: "Drama", name: "Drama" },
          { id: "Fantasy", name: "Fantasy" },
          { id: "Isekai", name: "Isekai" },
          { id: "Martial Arts", name: "Martial Arts" },
          { id: "Sci-Fi", name: "Sci-Fi" },
          { id: "Shounen", name: "Shounen" },
        ],
        statuses: [
          { id: "Ongoing", name: "Ongoing" },
          { id: "Completed", name: "Completed" },
        ],
        formats: [
          { id: "Manhwa", name: "Manhwa" },
          { id: "Manhua", name: "Manhua" },
          { id: "Manga", name: "Manga" },
        ],
        sorts: [],
      };
    }
  }
}
