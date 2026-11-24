import type { MangaDetail, MangaPageResult, Chapter, ChapterPages, MangaItem, SourceMetadata, FilterList } from "@/shared/sources/source-types";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import type { ResolvedSearchTag, SearchCatalogCandidate } from "@/shared/lib/search-intelligence";
import type { GlobalSearchResponse } from "@/shared/types/search";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourceQualityStore } from "@/shared/store/source-quality-store";

export class ApiRequestError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export type { GlobalSearchResponse };

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
        throw new ApiRequestError(data.error.message || `API Error: ${data.error.code}`, data.error.code || "UNKNOWN", res.status);
      }
      throw new Error(`API Error: ${res.status}`);
    }
    return data.data;
  }

  private async fetchSource<T>(sourceId: string, url: string, options?: RequestInit, mangaId?: string): Promise<T> {
    const start = performance.now();
    try {
      const result = await this.fetcher<T>(url, options);
      const latency = performance.now() - start;
      const { useSourceHealthStore } = await import("@/shared/store/source-health-store");
      useSourceHealthStore.getState().recordSuccess(sourceId, latency);
      if (!options?.signal?.aborted) useSourceQualityStore.getState().record(sourceId,mangaId,{
        kind:"api",ok:true,ms:latency,at:Date.now(),key:String(start)+":"+String(Math.random()),
      });
      return result;
    } catch (error: any) {
      // Local transport failures and client-side 4xx responses are not evidence of source health.
      // A weak signal must not mark an upstream source as degraded/offline in the UI.
      if (error?.name === "AbortError" || options?.signal?.aborted ||
          error instanceof TypeError ||
          (typeof navigator !== "undefined" && navigator.onLine === false) ||
          (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) ||
          ["CONTENT_RESTRICTED", "MAPPING_UNAVAILABLE", "CHAPTER_UNAVAILABLE", "CONTENT_NOT_FOUND", "SOURCE_DISABLED"].includes(error?.code)) throw error;
      // Unknown application errors and Redis failures are not upstream evidence.
      if (error instanceof ApiRequestError && ["SOURCE_DOWN","DOMAIN_CHANGED","ROUTE_CHANGED","PARSER_BROKEN","SCHEMA_CHANGED","UPSTREAM_TIMEOUT","UPSTREAM_BLOCKED","IMAGE_CDN_FAILURE"].includes(error.code)) {
        const { useSourceHealthStore } = await import("@/shared/store/source-health-store");
        useSourceHealthStore.getState().recordError(sourceId, error);
        useSourceQualityStore.getState().record(sourceId,mangaId,{kind:"api",ok:false,ms:performance.now()-start,at:Date.now(),key:String(start)+":"+String(Math.random())});
      }
      throw error;
    }
  }

  getSources() {
    return this.fetcher<SourceMetadata[]>("/api/sources");
  }

  getHealth() {
    return this.fetcher<Record<string, {
      status: NonNullable<SourceMetadata["status"]>;
      latency: string;
      uptime: string;
      message: string;
      checkedAt?: string;
    }>>("/api/sources/health");
  }

  private appendManifest(url: string, sourceId: string): string {
    url = this.appendReadPreferences(url);
    const customSource = dynamicSourceRegistry.get(sourceId);
    if (customSource?.manifestUrl) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}manifestUrl=${encodeURIComponent(customSource.manifestUrl)}`;
    }
    return url;
  }

  private appendReadPreferences(url: string): string {
    const [path, query] = url.split("?");
    const params = new URLSearchParams(query);
    const settings = useSettingsStore.getState();
    if (!params.has("hideNsfw")) params.set("hideNsfw", String(settings.hideNsfw !== false));
    params.set("languages", settings.preferredLanguages.join(","));
    params.set("dataSaver", String(settings.dataSaver));
    return `${path}?${params}`;
  }

  getFilters(sourceId: string) {
    return this.fetchSource<FilterList>(sourceId, this.appendManifest(`/api/sources/${sourceId}/filters`, sourceId));
  }

  getPopular(sourceId: string, page: number = 1) {
    return this.fetchSource<MangaPageResult>(sourceId, this.appendManifest(`/api/sources/${sourceId}/popular?page=${page}`, sourceId));
  }

  getLatest(sourceId: string, page: number = 1) {
    return this.fetchSource<MangaPageResult>(sourceId, this.appendManifest(`/api/sources/${sourceId}/latest?page=${page}`, sourceId));
  }

  search(sourceId: string, query: string, page: number = 1, filters?: Record<string, string | string[]>, isNsfwFiltered: boolean = useSettingsStore.getState().hideNsfw, options?: { signal?: AbortSignal }) {
    let url = `/api/sources/${sourceId}/search?q=${encodeURIComponent(query)}&page=${page}&hideNsfw=${isNsfwFiltered}`;

    const finalFilters = { ...filters };

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

    return this.fetchSource<{mangas?: MangaItem[], results?: MangaItem[], hasNextPage?: boolean}>(sourceId, url, { signal: options?.signal }).then(data => ({
      sourceId,
      query,
      page,
      results: data.mangas || data.results || [],
      hasNextPage: data.hasNextPage
    })) as Promise<SearchResponse>;
  }

  searchGlobal(query: string, sourceIds: string[], page: number = 1, isNsfwFiltered: boolean = useSettingsStore.getState().hideNsfw, filters?: Record<string, string | string[]>, options?: { signal?: AbortSignal }) {
    let url = `/api/sources/search?q=${encodeURIComponent(query)}&sources=${sourceIds.join(",")}&page=${page}&hideNsfw=${isNsfwFiltered}`;

    const finalFilters = { ...filters };

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

    return this.fetcher<GlobalSearchResponse>(this.appendReadPreferences(url), { signal: options?.signal });
  }

  rankSearchIntelligence(
    query: string,
    tags: ResolvedSearchTag[],
    candidates: SearchCatalogCandidate[]
  ) {
    return this.fetcher<{
      semanticAvailable: boolean;
      scores: Record<string, number>;
      catalogMatches: SearchCatalogCandidate[];
      metadataWorks?: import("@/shared/lib/metadata-catalog").MetadataWork[];
      metadataDiscovery?: import("@/shared/lib/metadata-catalog").MetadataWork[];
    }>(this.appendReadPreferences("/api/search/intelligence"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, tags, candidates }),
    });
  }

  getRelatedTitles(
    target: {
      canonicalKey?: string;
      sourceId: string;
      mangaId: string;
      title: string;
      coverUrl?: string;
      originalTitle?: string;
      alternativeTitles?: string[];
      author?: string;
      description?: string;
      genres?: string[];
      format?: string;
      status?: string;
    },
    limit = 8
  ) {
    const canonicalKey = target.canonicalKey || `${target.sourceId}::${target.mangaId}::${encodeURIComponent(target.title)}`;
    return this.fetcher<SearchCatalogCandidate[]>(this.appendReadPreferences("/api/search/related"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: { ...target, canonicalKey }, limit }),
    });
  }

  getDetail(sourceId: string, mangaId: string, options?: RequestInit) {
    return this.fetchSource<MangaDetail>(sourceId, this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}`, sourceId), options, mangaId);
  }

  getChapters(sourceId: string, mangaId: string, options?: RequestInit) {
    return this.fetchSource<Chapter[]>(sourceId, this.appendManifest(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters`, sourceId), options, mangaId).then(chapters=>{
      if (!options?.signal?.aborted) useSourceQualityStore.getState().recordChapters(sourceId,mangaId,chapters);
      return chapters;
    });
  }

  pagesQuery(sourceId: string, mangaId: string, chapterId: string) {
    const url = this.appendManifest(
      `/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters/${encodeURIComponent(chapterId)}/pages`,
      sourceId
    );

    return {
      queryKey: ["pages", url] as const,
      queryFn: () => this.fetchSource<ChapterPages>(sourceId, url, undefined, mangaId),
    };
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

            const res: Record<string, number | undefined> = Object.create(null);
            for (let i = 0; i < titles.length; i += 20) {
              const chunk = titles.slice(i, i + 20);
              const payload = await this.fetcher<{ data?: Record<string, number | undefined> } | Record<string, number | undefined>>(`/api/metadata/rating-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titles: chunk })
              });
              const scores = (payload && typeof payload === "object" && "data" in payload && payload.data)
                ? payload.data
                : (payload as Record<string, number | undefined> || {});
              Object.assign(res, scores);
            }

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
