import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  FilterList,
} from "@/shared/sources/source-types";
import { HttpClient } from "../base/http-client";
import { signImageUrl } from "@/server/lib/image";
import {
  normalizeChapter,
  normalizeMangaDetail,
  normalizeMangaItem,
} from "./normalizer";
import type {
  ShinigamiChapterListResponse,
  ShinigamiChapterPagesResponse,
  ShinigamiMangaDetailResponse,
  ShinigamiMangaListResponse,
} from "./types";

export class ShinigamiSource implements MangaSource {
  id = "shinigami";
  name = "Shinigami";
  description = "Indonesian translation source for manga and manhwa.";
  language = "id";
  baseUrl = "https://shngm.id";
  version = "1.0.0";
  icon = "https://shngm.id/favicon.ico";
  isEnabled = true;
  isInstalled = true;
  status = "online" as const;
  isNsfw = false;
  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
  };

  private client = new HttpClient("https://api.shngm.io", {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://c.shinigami.asia/",
    "Origin": "https://c.shinigami.asia",
    "DNT": "1",
  });

  async getPopular(page: number): Promise<MangaPageResult> {
    const res = await this.client.get<ShinigamiMangaListResponse>("/v1/manga/list", {
      page,
      page_size: 100,
      sort: "popularity",
    });

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: res.meta.page < res.meta.total_page,
    };
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const res = await this.client.get<ShinigamiMangaListResponse>("/v1/manga/list", {
      page,
      page_size: 100,
      sort: "latest",
    });

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: res.meta.page < res.meta.total_page,
    };
  }

  async search(query: string, page: number, filters?: Record<string, string | string[]>): Promise<MangaPageResult> {
    const params: Record<string, string | string[] | number> = {
      page,
      page_size: 100,
    };
    if (query) params.q = query;
    
    // Merge filters (like genre[], format, status)
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        params[k] = v;
      });
    }

    const res = await this.client.get<ShinigamiMangaListResponse>("/v1/manga/list", params);

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: res.meta.page < res.meta.total_page,
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const res = await this.client.get<ShinigamiMangaDetailResponse>(
      `/v1/manga/detail/${mangaId}`
    );
    return normalizeMangaDetail(res.data);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const res = await this.client.get<ShinigamiChapterListResponse>(
      `/v1/chapter/${mangaId}/list`,
      { page_size: 3000 }
    );
    return res.data.map((c) => normalizeChapter(c, mangaId));
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const res = await this.client.get<ShinigamiChapterPagesResponse>(
      `/v1/chapter/detail/${chapterId}`
    );
    const data = res.data;

    return {
      chapterId,
      pages: data.chapter.data.map((filename, index) => ({
        index,
        url: signImageUrl(`${data.base_url}${data.chapter.path}${filename}`, "https://c.shinigami.asia"),
      })),
    };
  }

  getFilters(): FilterList {
    return {
      genres: [
        { id: "action", name: "Action" },
        { id: "adventure", name: "Adventure" },
        { id: "comedy", name: "Comedy" },
        { id: "drama", name: "Drama" },
        { id: "fantasy", name: "Fantasy" },
        { id: "romance", name: "Romance" },
        { id: "sci-fi", name: "Sci-Fi" },
        { id: "slice-of-life", name: "Slice of Life" },
        { id: "sports", name: "Sports" },
        { id: "supernatural", name: "Supernatural" },
        { id: "mystery", name: "Mystery" },
        { id: "psychological", name: "Psychological" },
        { id: "horror", name: "Horror" },
        { id: "thriller", name: "Thriller" },
        { id: "historical", name: "Historical" },
        { id: "martial-arts", name: "Martial Arts" },
        { id: "isekai", name: "Isekai" },
        { id: "mecha", name: "Mecha" },
        { id: "school-life", name: "School Life" },
        { id: "shounen", name: "Shounen" },
        { id: "shoujo", name: "Shoujo" },
        { id: "seinen", name: "Seinen" },
        { id: "josei", name: "Josei" },
        { id: "harem", name: "Harem" },
        { id: "reverse-harem", name: "Reverse Harem" },
        { id: "ecchi", name: "Ecchi" },
        { id: "smut", name: "Smut" },
        { id: "yaoi", name: "Yaoi" },
        { id: "yuri", name: "Yuri" },
        { id: "tragedy", name: "Tragedy" },
        { id: "webtoon", name: "Webtoon" },
        { id: "magic", name: "Magic" },
        { id: "reincarnation", name: "Reincarnation" }
      ],
      formats: [
        { id: "manga", name: "Manga" },
        { id: "manhwa", name: "Manhwa" },
        { id: "manhua", name: "Manhua" }
      ],
      statuses: [
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
        { id: "hiatus", name: "Hiatus" }
      ],
      sorts: [
        { id: "popular", name: "Populer" },
        { id: "latest", name: "Terbaru" }
      ]
    };
  }
}
