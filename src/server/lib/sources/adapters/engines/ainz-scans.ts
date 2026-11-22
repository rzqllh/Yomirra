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
import { SourceError } from "../../error";

export class AinzScansSource extends BaseEngine {
  constructor() {
    super({
      id: "ainz-scans-id",
      name: "Ainz Scans ID",
      description: "Ainz Scans Indonesian manga reader API",
      language: "id",
      baseUrl: "https://v3.ainzscans01.com",
      category: "SFW",
      isNsfw: false,
    });
  }

  async getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    const p = Math.max(1, page || 1);
    try {
      const data = await this.client.get<{ results?: any[]; hasNextPage?: boolean }>(
        `/popular?page=${p}`
      ).catch(async () => {
        return this.client.get<{ results?: any[]; hasNextPage?: boolean }>(`/search?keyword=&page=${p}`);
      });

      const mangas: MangaItem[] = (data?.results ?? []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? "",
        coverUrl: item.thumbnail ?? item.cover ?? "",
        description: item.description,
        isNsfw: false,
        contentRating: "safe",
      }));

      return this.filterListingResults(
        { mangas, hasNextPage: Boolean(data?.hasNextPage || mangas.length >= 20) },
        options
      );
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async getLatest(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    const p = Math.max(1, page || 1);
    try {
      const data = await this.client.get<{ results?: any[]; hasNextPage?: boolean }>(
        `/latest?page=${p}`
      ).catch(async () => {
        return this.client.get<{ results?: any[]; hasNextPage?: boolean }>(`/search?keyword=&page=${p}`);
      });

      const mangas: MangaItem[] = (data?.results ?? []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? "",
        coverUrl: item.thumbnail ?? item.cover ?? "",
        description: item.description,
        isNsfw: false,
        contentRating: "safe",
      }));

      return this.filterListingResults(
        { mangas, hasNextPage: Boolean(data?.hasNextPage || mangas.length >= 20) },
        options
      );
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
    const p = Math.max(1, page || 1);
    try {
      const data = await this.client.get<{ results?: any[]; hasNextPage?: boolean }>(
        `/search?keyword=${encodeURIComponent(query)}&page=${p}`
      );

      const mangas: MangaItem[] = (data?.results ?? []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? "",
        coverUrl: item.thumbnail ?? item.cover ?? "",
        description: item.description,
        isNsfw: false,
        contentRating: "safe",
      }));

      return this.filterListingResults(
        { mangas, hasNextPage: Boolean(data?.hasNextPage || mangas.length >= 20) },
        options
      );
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }

  async getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail> {
    this.enforceContentPolicy("detail", options);
    try {
      const item = await this.client.get<any>(`/detail/${encodeURIComponent(mangaId)}`);

      let status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN" = "UNKNOWN";
      const s = (item.status || "").toLowerCase();
      if (s.includes("ongoing")) status = "ONGOING";
      else if (s.includes("completed")) status = "COMPLETED";

      return {
        id: String(item.id ?? mangaId),
        title: item.title ?? "",
        description: item.description ?? "",
        coverUrl: item.thumbnail ?? item.cover ?? "",
        genres: Array.isArray(item.genres) ? item.genres : [],
        status,
        author: Array.isArray(item.author) ? item.author.join(", ") : item.author,
        artist: Array.isArray(item.artist) ? item.artist.join(", ") : item.artist,
        isNsfw: false,
        contentRating: "safe",
      };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "detail");
    }
  }

  async getChapters(mangaId: string, options?: SourceReadOptions): Promise<Chapter[]> {
    this.enforceContentPolicy("chapters", options);
    try {
      const data = await this.client.get<{ chapters?: any[] }>(
        `/chapters/${encodeURIComponent(mangaId)}`
      );

      return (data?.chapters ?? []).map((ch: any, idx: number) => ({
        id: `${mangaId}/${String(ch.id)}`,
        mangaId,
        name: ch.name ?? `Chapter ${ch.number ?? idx + 1}`,
        title: ch.name ?? `Chapter ${ch.number ?? idx + 1}`,
        number: Number(ch.number) || idx + 1,
        date: ch.date ?? "",
        url: ch.url,
      }));
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "chapters");
    }
  }

  async getPages(chapterId: string, options?: SourceReadOptions): Promise<ChapterPages> {
    this.enforceContentPolicy("pages", options);
    try {
      // chapterId may be formatted as mangaId/chapterId or single id
      const parts = chapterId.split("/");
      const mangaId = parts.length > 1 ? parts[0] : "manga";
      const chId = parts.length > 1 ? parts[1] : parts[0];

      const data = await this.client.get<{ pages?: any[] }>(
        `/pages/${encodeURIComponent(mangaId)}/${encodeURIComponent(chId)}`
      );

      const pages: PageItem[] = (data?.pages ?? []).map((p: any, idx: number) => ({
        index: p.index ?? idx + 1,
        url: typeof p === "string" ? p : p.url,
        referer: `${this.baseUrl}/`,
      }));

      return { chapterId, pages };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "pages");
    }
  }
}
