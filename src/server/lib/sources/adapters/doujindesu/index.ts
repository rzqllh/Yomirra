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
import { HttpClient } from "../base/http-client";
import { normalizeSynopsis } from "@/shared/utils/normalize";
import { decryptDoujinPayload } from "./crypto";
import type {
  DoujinChapterDetail,
  DoujinGenre,
  DoujinMangaDetail,
  DoujinMangaItem,
} from "./types";

function normalizeMangaItem(item: DoujinMangaItem): MangaItem {
  const statusLower = item.status?.toLowerCase();
  const latestChapter = item.chapters?.[0];
  const description = normalizeSynopsis(item.description || item.sinopsis || "");

  return {
    id: item.slug || item.id,
    title: item.title,
    coverUrl: item.cover_url,
    description: description || undefined,
    format: item.type?.toUpperCase() || undefined,
    score: typeof item.rating === "number" ? item.rating : undefined,
    latestChapter: latestChapter ? `Chapter ${latestChapter.chapter_number}` : undefined,
    latestChapterTime: latestChapter?.created_at || item.updated_at || undefined,
    status:
      statusLower === "ongoing" || statusLower === "publishing"
        ? "ONGOING"
        : statusLower === "completed"
          ? "COMPLETED"
          : "UNKNOWN",
  };
}

function normalizeMangaDetail(item: DoujinMangaDetail): MangaDetail {
  const genres = (item.manga_genres || [])
    .map((g) => g.genres?.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);

  const statusLower = item.status?.toLowerCase();
  return {
    ...normalizeMangaItem(item),
    description: normalizeSynopsis(item.description || item.sinopsis || ""),
    author: item.author || undefined,
    artist: item.artist || undefined,
    genres,
    status:
      statusLower === "ongoing" || statusLower === "publishing"
        ? "ONGOING"
        : statusLower === "completed"
          ? "COMPLETED"
          : "UNKNOWN",
  };
}


function getFilterValues(
  filters: Record<string, string | string[]> | undefined,
  key: string
): string[] {
  const value = filters?.[key];
  if (Array.isArray(value)) return value.filter(Boolean);
  return typeof value === "string" && value ? value.split(",").filter(Boolean) : [];
}

function getItemGenreKeys(item: DoujinMangaItem): string[] {
  return (item.manga_genres || []).flatMap((entry) => {
    const genre = entry.genres;
    if (!genre) return [];
    return [genre.slug, genre.name]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase().trim().replace(/\s+/g, "-"));
  });
}

export class DoujinDesuSource implements MangaSource {
  public readonly id = "doujindesu";
  public readonly name = "Doujindesu";
  public readonly description = "Baca Doujinshi, Manga & Manhwa Bahasa Indonesia";
  public readonly language = "id";
  public readonly baseUrl = "https://doujin.desu.xxx/api";
  public readonly upstreamDomain = "doujin.desu.xxx";
  public readonly supportedLanguages = ["id"];
  public readonly version = "1.0.0";
  public readonly adapterVersion = "1.0.0";
  public readonly isEnabled = true;
  public readonly isInstalled = true;
  public readonly isNsfw = true; // Adult / NSFW attribute per user instruction
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

  private client?: HttpClient;

  constructor(client?: HttpClient) {
    this.client = client;
  }

  private getClient(): HttpClient {
    if (this.client) return this.client;

    const appSecret = process.env.RESTRICTED_SOURCE_APP_SECRET?.trim();
    if (!appSecret) {
      throw new Error("Restricted source credential is not configured");
    }

    this.client = new HttpClient({
      baseUrl: this.baseUrl,
      timeoutMs: 15000,
      allowedHosts: ["doujin.desu.xxx"],
      defaultHeaders: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://doujin.desu.xxx/",
        Accept: "application/json",
        "X-App-Secret": appSecret,
      },
    });

    return this.client;
  }

  private async fetchDecrypted<T>(
    path: string,
    params?: Record<string, string | number | boolean | string[]>
  ): Promise<T> {
    const raw = await this.getClient().get<unknown>(path, params);
    return decryptDoujinPayload<T>(raw);
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const items = await this.fetchDecrypted<DoujinMangaItem[]>("/manga", {
      offset: (pageNum - 1) * 20,
      limit: 20,
      sort: "latest_chapter",
    });

    const mangaList = Array.isArray(items) ? items : [];
    const mangas: MangaItem[] = mangaList.map(normalizeMangaItem);

    return {
      mangas,
      hasNextPage: mangas.length >= 20,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    return this.getPopular(page);
  }

  async search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const trimmed = (query || "").trim();

    const genreValues = getFilterValues(filters, "genre[]");
    const includedGenres = genreValues.filter((value) => !value.startsWith("-"));
    const excludedGenres = genreValues
      .filter((value) => value.startsWith("-"))
      .map((value) => value.slice(1));

    const statuses = getFilterValues(filters, "status").map((value) => value.toLowerCase());
    const formats = getFilterValues(filters, "format")
      .concat(getFilterValues(filters, "format[]"))
      .map((value) => value.toLowerCase());
    const sort = getFilterValues(filters, "sort")[0]?.toLowerCase() || "";

    const params: Record<string, string | number> = {
      offset: (pageNum - 1) * 20,
      limit: 20,
    };

    if (trimmed.length > 0) params.search = trimmed;
    if (includedGenres[0]) params.genre = includedGenres[0];
    if (sort === "latest" || sort === "update") params.sort = "latest_chapter";

    const items = await this.fetchDecrypted<DoujinMangaItem[]>("/manga", params);
    let mangaList = Array.isArray(items) ? [...items] : [];

    if (includedGenres.length > 1 || excludedGenres.length > 0) {
      const normalizedIncludes = includedGenres.map((value) =>
        value.toLowerCase().trim().replace(/\s+/g, "-")
      );
      const normalizedExcludes = excludedGenres.map((value) =>
        value.toLowerCase().trim().replace(/\s+/g, "-")
      );

      mangaList = mangaList.filter((item) => {
        const genreKeys = getItemGenreKeys(item);
        const includesMatch =
          normalizedIncludes.length <= 1 ||
          normalizedIncludes.every((value) => genreKeys.includes(value));
        const excludesMatch = normalizedExcludes.every((value) => !genreKeys.includes(value));
        return includesMatch && excludesMatch;
      });
    }

    if (statuses.length > 0) {
      mangaList = mangaList.filter((item) => {
        const status = item.status?.toLowerCase() || "unknown";
        return statuses.some((value) =>
          value === status ||
          (value === "ongoing" && status === "publishing")
        );
      });
    }

    if (formats.length > 0) {
      mangaList = mangaList.filter((item) =>
        formats.includes((item.type || "").toLowerCase())
      );
    }

    if (sort === "rating") {
      mangaList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "alphabetical" || sort === "alphabet" || sort === "title") {
      mangaList.sort((a, b) => a.title.localeCompare(b.title, "id", { sensitivity: "base" }));
    } else if (sort === "popular" || sort === "popularity") {
      mangaList.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    const mangas: MangaItem[] = mangaList.map(normalizeMangaItem);

    return {
      mangas,
      hasNextPage: items.length >= 20,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error("INVALID_MANGA_ID: DoujinDesu requires a manga slug or id");
    }

    const detail = await this.fetchDecrypted<DoujinMangaDetail>(
      `/manga/${encodeURIComponent(slug)}`
    );

    return normalizeMangaDetail(detail);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const slug = mangaId?.trim();
    if (!slug) {
      throw new Error("INVALID_MANGA_ID: DoujinDesu requires a manga slug or id");
    }

    const detail = await this.fetchDecrypted<DoujinMangaDetail>(
      `/manga/${encodeURIComponent(slug)}`
    );

    const chapters = detail.chapters || [];
    return chapters.map((c) => ({
      id: c.id,
      mangaId: detail.slug || slug,
      number: Number(c.chapter_number) || 0,
      title: `Chapter ${c.chapter_number}`,
      date: c.created_at || "",
    }));
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const id = chapterId?.trim();
    if (!id) {
      throw new Error("INVALID_CHAPTER_ID: DoujinDesu requires a chapter id");
    }

    const chapter = await this.fetchDecrypted<DoujinChapterDetail>(
      `/chapters/${encodeURIComponent(id)}`
    );

    const urls = chapter.content_urls || [];
    const pages: PageItem[] = urls.map((url, idx) => ({
      index: idx,
      url,
      referer: "https://doujin.desu.xxx/",
    }));

    return {
      chapterId: id,
      pages,
    };
  }

  async getFilters(): Promise<FilterList> {
    try {
      const raw = await this.fetchDecrypted<DoujinGenre[] | { data?: DoujinGenre[] }>("/genres");
      const genreList = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

      const genres = genreList
        .filter((genre) => genre?.name)
        .map((genre) => ({
          id:
            genre.slug ||
            String(genre.name).toLowerCase().trim().replace(/\s+/g, "-"),
          name: String(genre.name),
        }));

      return {
        genres,
        formats: [],
        statuses: [
          { id: "ongoing", name: "Ongoing" },
          { id: "completed", name: "Completed" },
        ],
        sorts: [
          { id: "popular", name: "Populer" },
          { id: "latest", name: "Terbaru" },
          { id: "rating", name: "Rating Tertinggi" },
          { id: "alphabetical", name: "A-Z" },
        ],
      };
    } catch {
      return {
        genres: [],
        formats: [],
        statuses: [
          { id: "ongoing", name: "Ongoing" },
          { id: "completed", name: "Completed" },
        ],
        sorts: [
          { id: "popular", name: "Populer" },
          { id: "latest", name: "Terbaru" },
          { id: "rating", name: "Rating Tertinggi" },
          { id: "alphabetical", name: "A-Z" },
        ],
      };
    }
  }
}
