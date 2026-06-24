import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  FilterList,
} from "@/shared/sources/source-types";
import { HttpClient } from "../base/http-client";
import { signImageUrl } from "@/server/lib/sign-proxy-url";
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
  baseUrl = "https://shinigami.asia";
  healthCheckUrl = "https://api.shngm.io/v1/manga/list?page=1&page_size=1";
  version = "1.0.0";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=shinigami.asia&sz=64";
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

  private getRandomUA() {
    const uas = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
    ];
    return uas[Math.floor(Math.random() * uas.length)];
  }

  private client = new HttpClient("https://api.shngm.io", {
    "User-Agent": this.getRandomUA(),
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
    let cleanQuery = query || "";
    const extractedGenres: string[] = [];

    if (cleanQuery) {
      // Extract tags:"Genre Name" or tags:GenreName or -tags:"Genre Name" or -tags:GenreName
      const tagRegex = /(-?)tags?:(?:"([^"]+)"|([^\s]+))/gi;
      let match;
      while ((match = tagRegex.exec(cleanQuery)) !== null) {
        const isNegative = match[1] === '-';
        const tagValue = (match[2] || match[3]).toLowerCase().replace(/\s+/g, '-');
        extractedGenres.push(isNegative ? `-${tagValue}` : tagValue);
      }
      cleanQuery = cleanQuery.replace(tagRegex, '').trim();
    }

    const params: Record<string, string | string[] | number> = {
      page,
      page_size: 100,
    };
    if (cleanQuery) params.q = cleanQuery;
    
    let excludedGenres: string[] = [];

    // Merge filters (like genre[], format, status)
    const genreFilter: string[] = [...extractedGenres];

    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (k === "genre[]") {
          const items = Array.isArray(v) ? v : [v];
          genreFilter.push(...items);
        } else {
          params[k] = Array.isArray(v) ? v.join(",") : v;
        }
      });
    }

    const included = genreFilter.filter((item) => !item.startsWith("-"));
    excludedGenres = genreFilter.filter((item) => item.startsWith("-")).map(item => item.slice(1));
    
    if (included.length > 0) {
      params["genre"] = included.join(",");
    }

    const res = await this.client.get<ShinigamiMangaListResponse>("/v1/manga/list", params);
    
    let filteredData = res.data;
    if (excludedGenres.length > 0) {
      filteredData = filteredData.filter(manga => {
        const mangaGenres = manga.taxonomy?.Genre?.map(g => g.slug) || [];
        return !mangaGenres.some(g => excludedGenres.includes(g));
      });
    }

    return {
      mangas: filteredData.map(normalizeMangaItem),
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
