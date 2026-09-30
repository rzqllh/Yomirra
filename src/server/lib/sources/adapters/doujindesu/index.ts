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
import { decryptDoujinPayload } from "./crypto";
import type {
  DoujinChapterDetail,
  DoujinMangaDetail,
  DoujinMangaItem,
} from "./types";

function normalizeMangaItem(item: DoujinMangaItem): MangaItem {
  return {
    id: item.slug || item.id,
    title: item.title,
    coverUrl: item.cover_url,
    status:
      item.status?.toLowerCase() === "ongoing"
        ? "ONGOING"
        : item.status?.toLowerCase() === "completed"
          ? "COMPLETED"
          : "UNKNOWN",
  };
}

function normalizeMangaDetail(item: DoujinMangaDetail): MangaDetail {
  const genres = (item.manga_genres || [])
    .map((g) => g.genres?.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);

  return {
    ...normalizeMangaItem(item),
    description: item.description || "",
    author: item.author || undefined,
    artist: item.artist || undefined,
    genres,
    status:
      item.status?.toLowerCase() === "ongoing"
        ? "ONGOING"
        : item.status?.toLowerCase() === "completed"
          ? "COMPLETED"
          : "UNKNOWN",
  };
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
  public readonly isEnabled = false; // Default disabled per user instruction
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
    filters: false,
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
        allowedHosts: ["doujin.desu.xxx"],
        defaultHeaders: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://doujin.desu.xxx/",
          Accept: "application/json",
          "X-App-Secret": "dfdf72051dbfdc7d76889ebd31324e74",
          "x-app-secret": "dfdf72051dbfdc7d76889ebd31324e74",
        },
      });
  }

  private async fetchDecrypted<T>(
    path: string,
    params?: Record<string, string | number | boolean | string[]>
  ): Promise<T> {
    const raw = await this.client.get<unknown>(path, params);
    return decryptDoujinPayload<T>(raw);
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const items = await this.fetchDecrypted<DoujinMangaItem[]>("/manga", {
      page: pageNum,
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
    _filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    const pageNum = Math.max(1, page || 1);
    const trimmed = (query || "").trim();

    const params: Record<string, string | number> = {
      page: pageNum,
      limit: 20,
    };

    if (trimmed.length > 0) {
      params.search = trimmed;
    }

    const items = await this.fetchDecrypted<DoujinMangaItem[]>("/manga", params);
    const mangaList = Array.isArray(items) ? items : [];
    const mangas: MangaItem[] = mangaList.map(normalizeMangaItem);

    return {
      mangas,
      hasNextPage: mangas.length >= 20,
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
    return { genres: [], formats: [], statuses: [], sorts: [] };
  }
}
