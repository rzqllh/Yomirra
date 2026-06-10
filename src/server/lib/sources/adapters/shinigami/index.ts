import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
} from "@/shared/types/source";
import { HttpClient } from "../base/http-client";
import { signImageUrl } from "@/shared/utils/image";
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
      page_size: 30,
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
      page_size: 30,
      sort: "latest",
    });

    return {
      mangas: res.data.map(normalizeMangaItem),
      hasNextPage: res.meta.page < res.meta.total_page,
    };
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    const res = await this.client.get<ShinigamiMangaListResponse>("/v1/manga/list", {
      page,
      page_size: 30,
      q: query,
    });

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
}
