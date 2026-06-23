import type { MangaDetail, MangaPageResult, Chapter, ChapterPages, MangaItem, SourceMetadata, FilterList } from "@/shared/sources/source-types";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";

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

  private appendManifest(url: string, sourceId: string): string {
    const customSource = dynamicSourceRegistry.get(sourceId);
    if (customSource?.manifestUrl) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}manifestUrl=${encodeURIComponent(customSource.manifestUrl)}`;
    }
    return url;
  }

  getFilters(sourceId: string) {
    return this.fetcher<FilterList>(this.appendManifest(`/api/sources/${sourceId}/filters`, sourceId));
  }

  getPopular(sourceId: string, page: number = 1) {
    return this.fetcher<MangaPageResult>(this.appendManifest(`/api/sources/${sourceId}/popular?page=${page}`, sourceId));
  }

  getLatest(sourceId: string, page: number = 1) {
    return this.fetcher<MangaPageResult>(this.appendManifest(`/api/sources/${sourceId}/latest?page=${page}`, sourceId));
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
    
    url = this.appendManifest(url, sourceId);
    
    return this.fetcher<{mangas?: MangaItem[], results?: MangaItem[], hasNextPage?: boolean}>(url).then(data => ({
      sourceId,
      query,
      page,
      results: data.mangas || data.results || [],
      hasNextPage: data.hasNextPage
    })) as Promise<SearchResponse>;
  }

  searchGlobal(query: string, sourceIds: string[], isNsfwFiltered: boolean = false, filters?: Record<string, string | string[]>) {
    let url = `/api/sources/search?q=${encodeURIComponent(query)}&sources=${sourceIds.join(",")}`;
    
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
    
    return this.fetcher<import("@/app/api/sources/search/route").GlobalSearchResponse>(url);
  }

  getDetail(sourceId: string, mangaId: string) {
    return this.fetcher<MangaDetail>(this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}`, sourceId));
  }

  getChapters(sourceId: string, mangaId: string) {
    return this.fetcher<Chapter[]>(this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters`, sourceId));
  }

  getPages(sourceId: string, mangaId: string, chapterId: string) {
    return this.fetcher<ChapterPages>(
      this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters/${encodeURIComponent(chapterId)}/pages`, sourceId)
    );
  }
}

export const apiClient = new ApiClient();
