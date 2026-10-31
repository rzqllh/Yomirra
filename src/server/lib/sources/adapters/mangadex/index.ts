import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  FilterList,
  SourceReadOptions,
} from "@/shared/sources/source-types";
import type {
  MangaDexMangaListResponse,
  MangaDexMangaResponse,
  MangaDexChapterListResponse,
  MangaDexAtHomeResponse,
  MangaDexChapterResponse,
} from "./types";
import {
  normalizeMangaItem,
  normalizeMangaDetail,
  normalizeChapter,
} from "./normalizer";
import { getMangaDexFilters } from "./tag-cache";
import { acquireToken, type AcquireTokenOptions } from "./throttle";
import { createMangaDexTransport } from "./transport";

import { isContentVisible } from "@/shared/sources/content-policy";
import { SourceError } from "@/server/lib/sources/error";

const API_BASE = "https://api.mangadex.org";
const PAGE_SIZE = 24;
const CHAPTERS_LIMIT = 500;

const MAX_RETRY_SLEEP_MS = 5000;
const FALLBACK_RETRY_DELAY_MS = 1000;

export function parseRetryAfter(headerVal: string | null): number {
  if (!headerVal) return FALLBACK_RETRY_DELAY_MS;

  const trimmed = headerVal.trim();
  const seconds = parseInt(trimmed, 10);
  if (!isNaN(seconds) && String(seconds) === trimmed) {
    const delayMs = seconds * 1000;
    return Math.min(Math.max(0, delayMs), MAX_RETRY_SLEEP_MS);
  }

  const dateMs = Date.parse(trimmed);
  if (!isNaN(dateMs)) {
    const delayMs = dateMs - Date.now();
    return Math.min(Math.max(0, delayMs), MAX_RETRY_SLEEP_MS);
  }

  return FALLBACK_RETRY_DELAY_MS;
}

type MangaDexTransport = ReturnType<typeof createMangaDexTransport>;

interface MdFetchDependencies {
  transport?: MangaDexTransport;
  acquire?: (options?: AcquireTokenOptions) => Promise<void>;
}

/** Throttled fetch wrapper for MangaDex API with bounded 429 retry. */
export function createMdFetch(dependencies: MdFetchDependencies = {}) {
  const transport = dependencies.transport ?? createMangaDexTransport();
  const acquire = dependencies.acquire ?? acquireToken;

  return async function mdFetch<T>(
    path: string,
    params?: Record<string, string | string[]>,
    init?: RequestInit
  ): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        if (Array.isArray(val)) {
          val.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.set(key, val);
        }
      }
    }

    const options: RequestInit = {
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        "User-Agent": "Yomirra/1.0.0 (https://github.com/rzqllh/Yomirra)",
        ...(init?.headers || {}),
      },
    };
    const context = transport.createContext(15000, init?.signal ?? undefined);

    context.callerSignal?.throwIfAborted();
    await acquire({ signal: context.callerSignal, deadlineMs: context.deadlineMs });
    let result = await transport.request(url, options, context);

    if (result.response.status === 429) {
      context.callerSignal?.throwIfAborted();
      const retryAfterHeader = result.response.headers.get("retry-after");
      const sleepMs = parseRetryAfter(retryAfterHeader);
      if (transport.remaining(context) - sleepMs >= 2000) {
        await transport.sleep(sleepMs, context);
        context.callerSignal?.throwIfAborted();
        await acquire({ signal: context.callerSignal, deadlineMs: context.deadlineMs });
        result = await transport.request(url, options, context, result.route);
      }
    }

    if (!result.response.ok) {
      throw new Error(
        `MangaDex API error ${result.response.status}: ${result.response.statusText}`
      );
    }

    return result.response.json() as Promise<T>;
  };
}

export const mdFetch = createMdFetch();

export class MangaDexSource implements MangaSource {
  constructor(private readonly request: typeof mdFetch = mdFetch) {}

  id = "mangadex";
  name = "MangaDex";
  description = "Largest international manga source with multi-language support.";
  language = "multi";
  baseUrl = "https://mangadex.org";
  version = "1.0.0";
  icon = "https://mangadex.org/favicon.svg";
  isEnabled = true;
  isInstalled = true;
  status = "online" as const;
  // A mixed catalog; every request still enforces content-level policy.
  isNsfw = false;
  isDynamic = false;
  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
    filters: true,
  };

  private baseParams(options: SourceReadOptions = {}): Record<string, string | string[]> {
    return {
      "includes[]": ["cover_art"],
      "contentRating[]": options.hideNsfw === false
        ? ["safe", "suggestive", "erotica", "pornographic"]
        : ["safe"],
      limit: String(PAGE_SIZE),
    };
  }

  async getPopular(page: number, options: SourceReadOptions = {}): Promise<MangaPageResult> {
    const offset = (page - 1) * PAGE_SIZE;
    const res = await this.request<MangaDexMangaListResponse>("/manga", {
      ...this.baseParams(options),
      "order[followedCount]": "desc",
      offset: String(offset),
    });

    return {
      mangas: res.data.map(normalizeMangaItem).filter((item) => isContentVisible(item, options.hideNsfw !== false)),
      hasNextPage: offset + res.data.length < res.total,
    };
  }

  async getLatest(page: number, options: SourceReadOptions = {}): Promise<MangaPageResult> {
    const offset = (page - 1) * PAGE_SIZE;
    const res = await this.request<MangaDexMangaListResponse>("/manga", {
      ...this.baseParams(options),
      "order[latestUploadedChapter]": "desc",
      offset: String(offset),
    });

    return {
      mangas: res.data.map(normalizeMangaItem).filter((item) => isContentVisible(item, options.hideNsfw !== false)),
      hasNextPage: offset + res.data.length < res.total,
    };
  }

  async search(query: string, page: number, filters?: Record<string, string | string[]>, options: SourceReadOptions = {}): Promise<MangaPageResult> {
    const offset = (page - 1) * PAGE_SIZE;
    const params: Record<string, string | string[]> = {
      ...this.baseParams(options),
      offset: String(offset),
    };

    if (query) {
      params.title = query;
    }

    // Map our filter keys to MangaDex params
    if (filters) {
      // Support both "genres" (old) and "genre[]" (standard)
      const genresInput = filters["genre[]"] || filters.genres;
      if (genresInput) {
        const genreIds = Array.isArray(genresInput) ? genresInput : [genresInput];
        const included: string[] = [];
        const excluded: string[] = [];
        
        genreIds.forEach(id => {
          // Ignore our internal NSFW minus tags as MangaDex handles NSFW via contentRating
          if (id.startsWith("-") && ["-adult", "-mature", "-smut", "-nsfw", "-ecchi", "-pornographic"].includes(id)) {
            return;
          }
          if (id.startsWith("-")) {
            excluded.push(id.substring(1));
          } else {
            included.push(id);
          }
        });
        
        if (included.length > 0) params["includedTags[]"] = included;
        if (excluded.length > 0) params["excludedTags[]"] = excluded;
      }
      
      const statusInput = filters["status"];
      if (statusInput) {
        const statuses = Array.isArray(statusInput) ? statusInput : [statusInput];
        params["status[]"] = statuses;
      }
      
      const sortInput = filters["sort"];
      if (sortInput) {
        const sortStr = Array.isArray(sortInput) ? sortInput[0] : sortInput;
        const nativeSorts = new Set(["followedCount", "latestUploadedChapter", "relevance", "rating", "createdAt", "title"]);
        let mdSort = nativeSorts.has(sortStr) ? sortStr : "relevance";
        if (sortStr === "popular" || sortStr === "popularity") mdSort = "followedCount";
        else if (sortStr === "latest") mdSort = "latestUploadedChapter";
        else if (sortStr === "update") mdSort = "latestUploadedChapter";
        else if (sortStr === "rating") mdSort = "rating";
        else if (sortStr === "title") mdSort = "title";
        
        params[`order[${mdSort}]`] = sortStr === "title" ? "asc" : "desc";
      }
    }

    // Guarantee a valid order parameter for MangaDex API if none was set by filters
    const hasOrderParam = Object.keys(params).some(k => k.startsWith("order["));
    if (!hasOrderParam) {
      if (query) {
        params["order[relevance]"] = "desc";
      } else {
        params["order[followedCount]"] = "desc";
      }
    }

    const res = await this.request<MangaDexMangaListResponse>("/manga", params);

    return {
      mangas: res.data.map(normalizeMangaItem).filter((item) => isContentVisible(item, options.hideNsfw !== false)),
      hasNextPage: offset + res.data.length < res.total,
    };
  }

  async getDetail(mangaId: string, options: SourceReadOptions = {}): Promise<MangaDetail> {
    const res = await this.request<MangaDexMangaResponse>(`/manga/${mangaId}`, {
      "includes[]": ["cover_art", "author", "artist"],
    });

    const detail = normalizeMangaDetail(res.data);
    if (!isContentVisible(detail, options.hideNsfw !== false)) {
      throw new SourceError("Konten disembunyikan oleh pengaturan konten", {
        code: "CONTENT_RESTRICTED", sourceId: this.id, stage: "detail", statusCode: 403,
      });
    }
    return detail;
  }

  async getChapters(mangaId: string, options: SourceReadOptions = {}): Promise<Chapter[]> {
    // Validate content before exposing chapter metadata from a direct link.
    await this.getDetail(mangaId, options);
    const languages = options.preferredLanguages?.length ? options.preferredLanguages : ["id", "en"];
    const allChapters: Chapter[] = [];
    const seenIds = new Set<string>();
    let offset = 0;
    let upstreamCount = 0;

    while (true) {
      const res = await this.request<MangaDexChapterListResponse>(
        `/manga/${mangaId}/feed`,
        {
          "translatedLanguage[]": languages,
          "contentRating[]": this.baseParams(options)["contentRating[]"],
          "order[chapter]": "desc",
          limit: String(CHAPTERS_LIMIT),
          offset: String(offset),
          "includes[]": ["scanlation_group"],
        }
      );
      if (!Array.isArray(res.data) || !Number.isFinite(res.total)) {
        throw new SourceError("Format daftar chapter berubah", {
          code: "SCHEMA_CHANGED", sourceId: this.id, stage: "chapters",
        });
      }
      upstreamCount += res.data.length;
      let newIds = 0;
      for (const chapter of res.data) {
        if (seenIds.has(chapter.id)) continue;
        seenIds.add(chapter.id);
        newIds++;
        if (chapter.attributes.externalUrl || chapter.attributes.pages <= 0) continue;
        allChapters.push(normalizeChapter(chapter, mangaId));
      }
      offset += res.data.length;
      if (offset >= res.total) break;
      if (!res.data.length || !newIds) {
        throw new SourceError("Pagination chapter tidak maju; coba muat ulang", {
          code: "SCHEMA_CHANGED", sourceId: this.id, stage: "chapters",
        });
      }
    }

    if (upstreamCount > 0 && allChapters.length === 0) {
      throw new SourceError("Chapter tersedia di sumber eksternal atau belum memiliki halaman baca", {
        code: "CHAPTER_UNAVAILABLE", sourceId: this.id, stage: "chapters", statusCode: 404,
      });
    }

    // Volume is part of identity. Unnumbered specials must not all collapse to chapter 0.
    const chosen = new Map<string, Chapter>();
    const preference = (chapter: Chapter) => {
      const index = languages.indexOf(chapter.language ?? "");
      return index < 0 ? languages.length : index;
    };
    for (const chapter of allChapters) {
      const identity = chapter.chapterNumber === undefined || chapter.chapterNumber === ""
        ? `special:${chapter.id}` : `${chapter.volume ?? ""}:${chapter.chapterNumber}`;
      const existing = chosen.get(identity);
      if (!existing || preference(chapter) < preference(existing) ||
          (preference(chapter) === preference(existing) &&
           (chapter.date > existing.date || (chapter.date === existing.date && chapter.id < existing.id)))) {
        chosen.set(identity, chapter);
      }
    }
    return Array.from(chosen.values()).sort((a, b) => {
      const volumeA = Number(a.volume);
      const volumeB = Number(b.volume);
      if (a.volume && b.volume && Number.isFinite(volumeA) && Number.isFinite(volumeB) && volumeA !== volumeB) {
        return volumeB - volumeA;
      }
      return b.number - a.number || b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
    });
  }

  async getPages(chapterId: string, options: SourceReadOptions = {}): Promise<ChapterPages> {
    const chapter = await this.request<MangaDexChapterResponse>(`/chapter/${chapterId}`);
    const parentId = chapter.data.relationships.find((item) => item.type === "manga")?.id;
    if (!parentId || (options.mangaId && parentId !== options.mangaId)) {
      throw new SourceError("Chapter tidak cocok dengan komik yang dipilih", {
        code: "MAPPING_UNAVAILABLE", sourceId: this.id, stage: "pages", statusCode: 409,
      });
    }
    await this.getDetail(parentId, options);
    if (chapter.data.attributes.externalUrl || chapter.data.attributes.pages <= 0) {
      throw new SourceError("Chapter ini belum memiliki halaman yang dapat dibaca di aplikasi", {
        code: "CHAPTER_UNAVAILABLE", sourceId: this.id, stage: "pages", statusCode: 404,
      });
    }
    const res = await this.request<MangaDexAtHomeResponse>(`/at-home/server/${chapterId}`, {});
    const saver = options.dataSaver === true && res.chapter?.dataSaver?.length > 0;
    const filenames = saver ? res.chapter.dataSaver : res.chapter?.data;
    if (!res.baseUrl || !res.chapter?.hash || !filenames?.length || filenames.some((file) => !file)) {
      throw new SourceError("Daftar gambar chapter belum tersedia", {
        code: "CHAPTER_UNAVAILABLE", sourceId: this.id, stage: "pages", statusCode: 404,
      });
    }
    return {
      chapterId,
      pages: filenames.map((filename, index) => ({
        index,
        url: `${res.baseUrl.replace(/\/$/, "")}/${saver ? "data-saver" : "data"}/${res.chapter.hash}/${filename}`,
        referer: "https://mangadex.org",
      })),
    };
  }

  async getFilters(): Promise<FilterList> {
    return getMangaDexFilters();
  }
}
