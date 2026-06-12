import type { MangaDetail, MangaPageResult, Chapter, ChapterPages, MangaItem, SourceMetadata, FilterList } from "@/shared/sources/source-types";

export interface SearchResponse {
  sourceId: string;
  query: string;
  page: number;
  results: MangaItem[];
  hasNextPage?: boolean;
}

class ApiClient {
  private async fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) {
      if (data.error) {
        throw new Error(data.error.message || `API Error: ${data.error.code}`);
      }
      throw new Error(`API Error: ${res.status}`);
    }
    return data.data;
  }

  getSources() {
    return this.fetcher<SourceMetadata[]>("/api/sources");
  }

  getFilters(sourceId: string) {
    return this.fetcher<FilterList>(`/api/sources/${sourceId}/filters`);
  }

  getPopular(sourceId: string, page: number = 1) {
    return this.fetcher<MangaPageResult>(`/api/sources/${sourceId}/popular?page=${page}`);
  }

  getLatest(sourceId: string, page: number = 1) {
    return this.fetcher<MangaPageResult>(`/api/sources/${sourceId}/latest?page=${page}`);
  }

  search(sourceId: string, query: string, page: number = 1, filters?: Record<string, string | string[]>, isNsfwFiltered: boolean = false) {
    let url = `/api/sources/${sourceId}/search?q=${encodeURIComponent(query)}&page=${page}`;
    
    const finalFilters = { ...filters };
    
    if (isNsfwFiltered) {
      const nsfwTags = ["-adult", "-mature", "-smut", "-nsfw", "-ecchi"];
      const existingGenres = finalFilters["genre[]"];
      
      if (Array.isArray(existingGenres)) {
        finalFilters["genre[]"] = [...existingGenres, ...nsfwTags];
      } else if (typeof existingGenres === "string") {
        finalFilters["genre[]"] = [existingGenres, ...nsfwTags];
      } else {
        finalFilters["genre[]"] = nsfwTags;
      }
    }

    if (Object.keys(finalFilters).length > 0) {
      const sp = new URLSearchParams();
      Object.entries(finalFilters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => sp.append(k, val));
        } else if (v !== undefined) {
          sp.set(k, v);
        }
      });
      url += `&${sp.toString()}`;
    }
    return this.fetcher<{mangas?: MangaItem[], results?: MangaItem[], hasNextPage?: boolean}>(url).then(data => ({
      sourceId,
      query,
      page,
      results: data.mangas || data.results || [],
      hasNextPage: data.hasNextPage
    })) as Promise<SearchResponse>;
  }

  searchGlobal(query: string, sourceIds: string[], isNsfwFiltered: boolean = false) {
    let url = `/api/sources/search?q=${encodeURIComponent(query)}&sources=${sourceIds.join(",")}`;
    if (isNsfwFiltered) {
      url += `&genre[]=-adult&genre[]=-mature&genre[]=-smut&genre[]=-nsfw&genre[]=-ecchi`;
    }
    return this.fetcher<import("@/app/api/sources/search/route").GlobalSearchResponse>(url);
  }

  getDetail(sourceId: string, mangaId: string) {
    return this.fetcher<MangaDetail>(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}`);
  }

  getChapters(sourceId: string, mangaId: string) {
    return this.fetcher<Chapter[]>(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters`);
  }

  getPages(sourceId: string, mangaId: string, chapterId: string) {
    return this.fetcher<ChapterPages>(
      `/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters/${encodeURIComponent(chapterId)}/pages`
    );
  }
}

export const apiClient = new ApiClient();
