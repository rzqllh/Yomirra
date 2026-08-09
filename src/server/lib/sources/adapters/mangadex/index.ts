import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  FilterList,
} from "@/shared/sources/source-types";
import type {
  MangaDexMangaListResponse,
  MangaDexMangaResponse,
  MangaDexChapterListResponse,
  MangaDexAtHomeResponse,
} from "./types";
import {
  normalizeMangaItem,
  normalizeMangaDetail,
  normalizeChapter,
} from "./normalizer";
import { getMangaDexFilters } from "./tag-cache";
import { acquireToken } from "./throttle";

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

/** Throttled fetch wrapper for MangaDex API with bounded 429 retry */
export async function mdFetch<T>(path: string, params?: Record<string, string | string[]>): Promise<T> {
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

  const fullUrl = url.toString();
  const options: RequestInit = {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { 
      Accept: "application/json",
      "User-Agent": "Yomirra/1.0.0 (https://github.com/rzqllh/Yomirra)"
    },
  };

  await acquireToken();
  let res = await fetch(fullUrl, options);

  if (res.status === 429) {
    const retryAfterHeader = res.headers ? res.headers.get("retry-after") : null;
    const sleepMs = parseRetryAfter(retryAfterHeader);
    await new Promise((r) => setTimeout(r, sleepMs));

    await acquireToken();
    res = await fetch(fullUrl, options);
  }

  if (!res.ok) {
    throw new Error(`MangaDex API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export class MangaDexSource implements MangaSource {
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
  isNsfw = true;
  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
  };

  private baseParams(): Record<string, string | string[]> {
    return {
      "includes[]": ["cover_art"],
      "contentRating[]": ["safe", "suggestive", "erotica"],
      limit: String(PAGE_SIZE),
    };
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const offset = (page - 1) * PAGE_SIZE;
    const res = await mdFetch<MangaDexMangaListResponse>("/manga", {
      ...this.baseParams(),
      "order[followedCount]": "desc",
      offset: String(offset),
    });

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: offset + res.data.length < res.total,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const offset = (page - 1) * PAGE_SIZE;
    const res = await mdFetch<MangaDexMangaListResponse>("/manga", {
      ...this.baseParams(),
      "order[latestUploadedChapter]": "desc",
      offset: String(offset),
    });

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: offset + res.data.length < res.total,
    };
  }

  async search(query: string, page: number, filters?: Record<string, string | string[]>): Promise<MangaPageResult> {
    const offset = (page - 1) * PAGE_SIZE;
    const params: Record<string, string | string[]> = {
      ...this.baseParams(),
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
        let mdSort = "relevance";
        if (sortStr === "popular") mdSort = "followedCount";
        else if (sortStr === "latest") mdSort = "latestUploadedChapter";
        else if (sortStr === "update") mdSort = "latestUploadedChapter";
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

    const res = await mdFetch<MangaDexMangaListResponse>("/manga", params);

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: offset + res.data.length < res.total,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const res = await mdFetch<MangaDexMangaResponse>(`/manga/${mangaId}`, {
      "includes[]": ["cover_art", "author", "artist"],
    });

    return normalizeMangaDetail(res.data);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const allChapters: Chapter[] = [];
    let offset = 0;
    let hasMore = true;

    // First try ID language, then fallback EN
    while (hasMore) {
      const res = await mdFetch<MangaDexChapterListResponse>(`/manga/${mangaId}/feed`, {
        "translatedLanguage[]": ["id", "en"],
        "order[chapter]": "desc",
        limit: String(CHAPTERS_LIMIT),
        offset: String(offset),
        "includes[]": ["scanlation_group"],
      });

      const normalized = res.data.map(ch => normalizeChapter(ch, mangaId));
      allChapters.push(...normalized);

      offset += res.data.length;
      hasMore = offset < res.total && res.data.length === CHAPTERS_LIMIT;
    }

    // Deduplicate: prefer ID over EN for same chapter number
    const seen = new Map<number, Chapter>();
    for (const ch of allChapters) {
      const existing = seen.get(ch.number);
      if (!existing) {
        seen.set(ch.number, ch);
      } else if (ch.title.includes("[EN]") && !existing.title.includes("[EN]")) {
        // Keep ID version, skip EN duplicate
        continue;
      } else if (!ch.title.includes("[EN]") && existing.title.includes("[EN]")) {
        // Replace EN with ID
        seen.set(ch.number, ch);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.number - a.number);
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const res = await mdFetch<MangaDexAtHomeResponse>(`/at-home/server/${chapterId}`, {});

    return {
      chapterId,
      pages: res.chapter.data.map((filename, index) => ({
        index,
        url: `${res.baseUrl}/data/${res.chapter.hash}/${filename}`,
        referer: "https://mangadex.org",
      })),
    };
  }

  async getFilters(): Promise<FilterList> {
    return getMangaDexFilters();
  }
}

