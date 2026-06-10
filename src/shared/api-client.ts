import type { MangaDetail, MangaPageResult, Chapter, ChapterPages, MangaItem, SourceMetadata } from "@/shared/types/source";

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

  getPopular(sourceId: string, page: number = 1) {
    return this.fetcher<MangaPageResult>(`/api/sources/${sourceId}/popular?page=${page}`);
  }

  getLatest(sourceId: string, page: number = 1) {
    return this.fetcher<MangaPageResult>(`/api/sources/${sourceId}/latest?page=${page}`);
  }

  search(sourceId: string, query: string, page: number = 1) {
    return this.fetcher<SearchResponse>(`/api/sources/${sourceId}/search?q=${encodeURIComponent(query)}&page=${page}`);
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
