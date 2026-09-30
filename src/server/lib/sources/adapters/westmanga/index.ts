import type {
  Chapter,
  ChapterPages,
  FilterList,
  MangaDetail,
  MangaItem,
  MangaPageResult,
  MangaSource,
  PageItem,
} from "@/shared/sources/source-types";
import type { SourceCapabilities } from "@/shared/sources/source-capabilities";
import { normalizeSynopsis } from "@/shared/utils/normalize";
import { HttpClient } from "../base/http-client";
import { getWestMangaHeaders } from "./crypto";
import type {
  WestMangaApiResponse,
  WestMangaDetail,
  WestMangaGenre,
  WestMangaItem,
  WestMangaReaderData,
} from "./types";

function normalizeMangaItem(item: WestMangaItem): MangaItem {
  const statusLower = item.status?.toLowerCase();
  return {
    id: item.slug || String(item.id),
    title: item.title,
    coverUrl: item.cover,
    description: item.sinopsis ? normalizeSynopsis(item.sinopsis) : undefined,
    status:
      statusLower === "ongoing" || statusLower === "publishing"
        ? "ONGOING"
        : statusLower === "completed"
          ? "COMPLETED"
          : "UNKNOWN",
    score: item.rating ? Number(item.rating) : undefined,
  };
}

function normalizeMangaDetail(item: WestMangaDetail): MangaDetail {
  const genres = (item.genres || [])
    .map((g) => g.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);

  const statusLower = item.status?.toLowerCase();
  return {
    ...normalizeMangaItem(item),
    description: normalizeSynopsis(item.sinopsis || ""),
    author: item.author || undefined,
    genres,
    status:
      statusLower === "ongoing" || statusLower === "publishing"
        ? "ONGOING"
        : statusLower === "completed"
          ? "COMPLETED"
          : "UNKNOWN",
  };
}

export class WestMangaSource implements MangaSource {
  public readonly id = "westmanga";
  public readonly name = "WestManga";
  public readonly description = "Baca manga, manhwa & manhua online terlengkap bahasa Indonesia";
  public readonly language = "id";
  public readonly baseUrl = "https://v1.westmanga.my";
  public readonly upstreamDomain = "data.mantweh.online";
  public readonly supportedLanguages = ["id"];
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
  private apiBaseUrl: string;

  constructor(client?: HttpClient, apiBaseUrl = "https://data.mantweh.online") {
    this.apiBaseUrl = apiBaseUrl;
    this.client =
      client ??
      new HttpClient({
        baseUrl: this.apiBaseUrl,
        timeoutMs: 15000,
        allowedHosts: ["data.mantweh.online", "v1.westmanga.my", "v1.westmanga.top"],
        defaultHeaders: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: "https://v1.westmanga.my/",
          Origin: "https://v1.westmanga.my",
          Accept: "application/json, text/plain, */*",
        },
      });
  }

  private async requestApi<T>(
    path: string,
    params?: Record<string, string | number | boolean | string[]>
  ): Promise<T> {
    const headers = getWestMangaHeaders(path, "GET");
    return this.client.get<T>(path, params, { headers });
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const res = await this.requestApi<WestMangaApiResponse<WestMangaItem[]>>("/api/contents", {
      page: pageNum,
      sortBy: "popular",
    });

    const mangaList = Array.isArray(res?.data) ? res.data : [];
    const mangas: MangaItem[] = mangaList.map(normalizeMangaItem);

    return {
      mangas,
      hasNextPage: mangas.length >= 20,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const res = await this.requestApi<WestMangaApiResponse<WestMangaItem[]>>("/api/contents", {
      page: pageNum,
      sortBy: "update",
    });

    const mangaList = Array.isArray(res?.data) ? res.data : [];
    const mangas: MangaItem[] = mangaList.map(normalizeMangaItem);

    return {
      mangas,
      hasNextPage: mangas.length >= 20,
    };
  }

  async search(
    query: string,
    page: number,
    _filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const trimmed = (query || "").trim();

    const params: Record<string, string | number> = {
      page: pageNum,
    };

    if (trimmed.length > 0) {
      params.q = trimmed;
    }

    const res = await this.requestApi<WestMangaApiResponse<WestMangaItem[]>>("/api/contents", params);

    const mangaList = Array.isArray(res?.data) ? res.data : [];
    const mangas: MangaItem[] = mangaList.map(normalizeMangaItem);

    return {
      mangas,
      hasNextPage: mangas.length >= 20,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error("INVALID_MANGA_ID: WestManga requires a manga slug");
    }

    const res = await this.requestApi<WestMangaApiResponse<WestMangaDetail>>(
      `/api/comic/${encodeURIComponent(slug)}`
    );

    if (!res?.data) {
      throw new Error(`MANGA_NOT_FOUND: Failed to find manga with slug ${slug}`);
    }

    return normalizeMangaDetail(res.data);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error("INVALID_MANGA_ID: WestManga requires a manga slug");
    }

    const res = await this.requestApi<WestMangaApiResponse<WestMangaDetail>>(
      `/api/comic/${encodeURIComponent(slug)}`
    );

    const chapters = res?.data?.chapters || [];
    return chapters.map((c) => ({
      id: c.slug || String(c.id),
      mangaId: res?.data?.slug || slug,
      number: parseFloat(String(c.number)) || 0,
      title: `Chapter ${c.number}`,
      date: c.updated_at?.formatted || c.created_at?.formatted || "",
    }));
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const id = chapterId?.trim();
    if (!id) {
      throw new Error("INVALID_CHAPTER_ID: WestManga requires a chapter slug");
    }

    const res = await this.requestApi<WestMangaApiResponse<WestMangaReaderData>>(
      `/api/v/${encodeURIComponent(id)}`
    );

    const urls = res?.data?.images || [];
    const pages: PageItem[] = urls.map((url, idx) => ({
      index: idx,
      url,
      referer: "https://v1.westmanga.my/",
    }));

    return {
      chapterId: id,
      pages,
    };
  }

  async getFilters(): Promise<FilterList> {
    try {
      const res = await this.requestApi<WestMangaApiResponse<WestMangaGenre[]>>("/api/contents/genres");
      const genres = Array.isArray(res?.data)
        ? res.data.map((g) => ({
            id: g.slug || String(g.id || g.name || ""),
            name: g.name || "",
          }))
        : [];

      return {
        genres,
        formats: [],
        statuses: [
          { id: "ongoing", name: "Ongoing" },
          { id: "completed", name: "Completed" },
        ],
        sorts: [
          { id: "popular", name: "Popular" },
          { id: "update", name: "Terbaru" },
        ],
      };
    } catch {
      return { genres: [], formats: [], statuses: [], sorts: [] };
    }
  }
}
