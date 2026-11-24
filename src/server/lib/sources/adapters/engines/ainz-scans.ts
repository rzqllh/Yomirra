import type {
  Chapter, ChapterPages, MangaDetail, MangaItem, MangaPageResult, SourceReadOptions,
} from "@/shared/sources/source-types";
import { BaseEngine } from "./base-engine";
import { SourceError } from "../../error";
import { UpstreamHttpError } from "../base/http-client";
import { stagedComicFormat } from "./normalize-catalog";

type Row = Record<string, unknown>;
function record(value: unknown): Row | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : undefined;
}
function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function identifier(value: unknown): string | undefined {
  const id = typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? String(value) : text(value);
  return id && /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,299}$/.test(id) ? id : undefined;
}
function names(value: unknown): string | undefined {
  return Array.isArray(value) ? value.map(text).filter(Boolean).join(", ") || undefined : text(value);
}
function number(value: unknown): number | undefined {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim()))) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
function httpsUrl(value: unknown, base: string): string | undefined {
  const raw = text(value);
  if (!raw || raw.length > 2000 || /[\u0000-\u001f\\]/.test(raw)) return undefined;
  try {
    const url = new URL(raw, base + "/");
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash
      ? url.href : undefined;
  } catch { return undefined; }
}

export class AinzScansSource extends BaseEngine {
  constructor() {
    super({
      id: "ainzscansid",
      name: "Ainz Scans ID",
      description: "Ainz Scans Indonesian manga reader API",
      language: "id",
      baseUrl: "https://v3.ainzscans01.com",
      category: "SFW",
      isNsfw: false,
    });
  }

  private schema(stage: "search" | "detail" | "chapters" | "pages"): never {
    throw new SourceError("Ainz response schema changed", { code: "SCHEMA_CHANGED", sourceId: this.id, stage });
  }
  private requireId(value: unknown, stage: "detail" | "chapters" | "pages"): string {
    const id = identifier(value);
    if (!id || id !== value) {
      throw new SourceError("Invalid Ainz identifier", { code: "CONTENT_NOT_FOUND", sourceId: this.id, stage, statusCode: 400 });
    }
    return id;
  }
  private parseListing(value: unknown): MangaPageResult {
    const data = record(value);
    if (!data || !Array.isArray(data.results)) this.schema("search");
    const seen = new Set<string>();
    const mangas: MangaItem[] = data.results.map(value => {
      const item = record(value);
      const id = identifier(item?.id);
      const title = text(item?.title);
      if (!item || !id || !title || seen.has(id)) this.schema("search");
      seen.add(id);
      return {
        id, title,
        coverUrl: httpsUrl(item.thumbnail, this.baseUrl) ?? httpsUrl(item.cover, this.baseUrl) ?? "",
        description: text(item.description),
        author: names(item.author),
        format: stagedComicFormat(item.type ?? item.format),
        contentRating: "unknown",
      };
    });
    return { mangas, hasNextPage: typeof data.hasNextPage === "boolean" ? data.hasNextPage : mangas.length >= 20 };
  }
  private async listing(path: string, page: number, options?: SourceReadOptions, fallback = false): Promise<MangaPageResult> {
    try {
      const data = await this.client.get<unknown>(path).catch(async (err: unknown) => {
        // A missing optional listing endpoint may use the legacy search fallback.
        // Do not amplify rate limits, denied access, timeouts or schema failures.
        if (!fallback || !(err instanceof UpstreamHttpError) || ![404, 405].includes(err.status)) throw err;
        return this.client.get<unknown>("/search?keyword=&page=" + page);
      });
      return this.filterListingResults(this.parseListing(data), options);
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "search");
    }
  }
  async getPopular(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    const p = Math.max(1, page || 1);
    return this.listing("/popular?page=" + p, p, options, true);
  }
  async getLatest(page: number, options?: SourceReadOptions): Promise<MangaPageResult> {
    const p = Math.max(1, page || 1);
    return this.listing("/latest?page=" + p, p, options, true);
  }
  async search(query: string, page: number, _filters?: Record<string, string | string[]>, options?: SourceReadOptions): Promise<MangaPageResult> {
    const p = Math.max(1, page || 1);
    return this.listing("/search?keyword=" + encodeURIComponent(query) + "&page=" + p, p, options);
  }
  async getDetail(mangaId: string, options?: SourceReadOptions): Promise<MangaDetail> {
    this.enforceContentPolicy("detail", options);
    this.requireId(mangaId, "detail");
    try {
      const item = record(await this.client.get<unknown>("/detail/" + encodeURIComponent(mangaId)));
      const title = text(item?.title);
      if (!item || !title || (item.id != null && identifier(item.id) !== mangaId)) this.schema("detail");
      const s = text(item.status)?.toLowerCase() ?? "";
      const status = s.includes("ongoing") ? "ONGOING" : s.includes("completed") ? "COMPLETED" : "UNKNOWN";
      return {
        id: mangaId, title,
        description: text(item.description) ?? "",
        coverUrl: httpsUrl(item.thumbnail, this.baseUrl) ?? httpsUrl(item.cover, this.baseUrl) ?? "",
        genres: Array.isArray(item.genres) ? item.genres.flatMap(g => text(g) ?? []) : [],
        status,
        author: names(item.author), artist: names(item.artist),
        format: stagedComicFormat(item.type ?? item.format),
        contentRating: "unknown",
      };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "detail");
    }
  }
  async getChapters(mangaId: string, options?: SourceReadOptions): Promise<Chapter[]> {
    this.enforceContentPolicy("chapters", options);
    this.requireId(mangaId, "chapters");
    try {
      const data = record(await this.client.get<unknown>("/chapters/" + encodeURIComponent(mangaId)));
      if (!data || !Array.isArray(data.chapters)) this.schema("chapters");
      const seen = new Set<string>();
      return data.chapters.map(value => {
        const ch = record(value);
        const id = identifier(ch?.id);
        const chapterNumber = number(ch?.number);
        if (!ch || !id || chapterNumber === undefined || seen.has(id) ||
            (ch.mangaId != null && identifier(ch.mangaId) !== mangaId)) this.schema("chapters");
        seen.add(id);
        return {
          id: mangaId + "/" + id, mangaId, number: chapterNumber,
          title: text(ch.name) ?? "Chapter " + chapterNumber,
          date: text(ch.date) ?? "",
          scanlator: text(ch.scan),
          url: httpsUrl(ch.url, this.baseUrl),
          ...(typeof ch.isLocked === "boolean" ? { isLocked: ch.isLocked } : {}),
        };
      });
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "chapters");
    }
  }
  async getPages(chapterId: string, options?: SourceReadOptions): Promise<ChapterPages> {
    this.enforceContentPolicy("pages", options);
    const parts = chapterId.split("/");
    const mangaId = this.requireId(parts.length === 2 ? parts[0] : options?.mangaId, "pages");
    const chId = this.requireId(parts.length === 2 ? parts[1] : chapterId, "pages");
    if (parts.length > 2 || (options?.mangaId && options.mangaId !== mangaId)) {
      throw new SourceError("Ainz chapter parent mismatch", { code: "CHAPTER_UNAVAILABLE", sourceId: this.id, stage: "pages", statusCode: 400 });
    }
    try {
      const data = record(await this.client.get<unknown>("/pages/" + encodeURIComponent(mangaId) + "/" + encodeURIComponent(chId)));
      if (!data || !Array.isArray(data.pages) || data.pages.length === 0) this.schema("pages");
      const pages = data.pages.map((p, idx) => {
        const url = httpsUrl(typeof p === "string" ? p : record(p)?.url, this.baseUrl);
        if (!url) this.schema("pages");
        return { index: idx + 1, url, referer: this.baseUrl + "/" };
      });
      return { chapterId, pages };
    } catch (err) {
      if (SourceError.isSourceError(err)) throw err;
      throw SourceError.classify(err, this.id, "pages");
    }
  }
}
