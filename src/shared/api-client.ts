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

  getHealth() {
    return this.fetcher<Record<string, { status: string; latency: string; uptime: string; message: string; }>>("/api/sources/health");
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

  search(sourceId: string, query: string, page: number = 1, filters?: Record<string, string | string[]>, isNsfwFiltered: boolean = false, options?: { signal?: AbortSignal }) {
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
    
    return this.fetcher<{mangas?: MangaItem[], results?: MangaItem[], hasNextPage?: boolean}>(url, { signal: options?.signal }).then(data => ({
      sourceId,
      query,
      page,
      results: data.mangas || data.results || [],
      hasNextPage: data.hasNextPage
    })) as Promise<SearchResponse>;
  }

  searchGlobal(query: string, sourceIds: string[], page: number = 1, isNsfwFiltered: boolean = false, filters?: Record<string, string | string[]>) {
    let url = `/api/sources/search?q=${encodeURIComponent(query)}&sources=${sourceIds.join(",")}&page=${page}`;
    
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

  getChapters(sourceId: string, mangaId: string, options?: RequestInit) {
    return this.fetcher<Chapter[]>(this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters`, sourceId), options);
  }

  getPages(sourceId: string, mangaId: string, chapterId: string) {
    return this.fetcher<ChapterPages>(
      this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters/${encodeURIComponent(chapterId)}/pages`, sourceId)
    );
  }

  async toggleHistory(sourceId: string, mangaId: string): Promise<{ added: boolean }> {
    return this.fetcher<{ added: boolean }>(`/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, mangaId })
    });
  }

  private ratingBatch: { title: string; resolve: (val: {score?: number}) => void; reject: (err: unknown) => void }[] = [];
  private ratingTimeout: NodeJS.Timeout | null = null;

  async getRatingScore(title: string): Promise<{ score?: number }> {
    return new Promise((resolve, reject) => {
      this.ratingBatch.push({ title, resolve, reject });
      
      if (!this.ratingTimeout) {
        this.ratingTimeout = setTimeout(async () => {
          const currentBatch = [...this.ratingBatch];
          this.ratingBatch = [];
          this.ratingTimeout = null;

          try {
            const titles = Array.from(new Set(currentBatch.map(b => b.title))).filter(Boolean);
            if (titles.length === 0) {
               currentBatch.forEach(b => b.resolve({ score: undefined }));
               return;
            }

            const res = await this.fetcher<Record<string, number | undefined>>(`/api/metadata/rating-batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ titles })
            });

            currentBatch.forEach(b => {
              b.resolve({ score: res[b.title] });
            });
          } catch (e) {
            currentBatch.forEach(b => b.reject(e));
          }
        }, 50); // Accumulate calls for 50ms
      }
    });
  }
}

export const apiClient = new ApiClient();
