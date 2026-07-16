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

/** Throttled fetch wrapper for MangaDex API */
async function mdFetch<T>(path: string, params?: Record<string, string | string[]>): Promise<T> {
  await acquireToken();

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

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { 
      Accept: "application/json",
      "User-Agent": "Yomirra/1.0.0 (https://github.com/rzqllh/Yomirra)"
    },
  });

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
      if (filters.genres) {
        // genres are already MangaDex tag UUIDs
        const genreIds = Array.isArray(filters.genres) ? filters.genres : [filters.genres];
        params["includedTags[]"] = genreIds;
      }
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        params["status[]"] = statuses;
      }
      if (filters.sort) {
        const sort = Array.isArray(filters.sort) ? filters.sort[0] : filters.sort;
        params[`order[${sort}]`] = "desc";
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

