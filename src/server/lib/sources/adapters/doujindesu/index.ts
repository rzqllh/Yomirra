import * as cheerio from "cheerio";
import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaPageResult,
  MangaSource,
  FilterList,
} from "@/shared/sources/source-types";
import { HttpClient } from "../base/http-client";

export class DoujindesuSource implements MangaSource {
  id = "doujindesu";
  name = "Doujindesu";
  description = "Baca Doujinshi Bahasa Indonesia (18+)";
  language = "id";
  baseUrl = "https://doujindesu.tv";
  version = "1.0.0";
  icon = "https://doujindesu.tv/favicon.ico";
  isEnabled = true;
  isInstalled = true;
  status = "unavailable" as const;
  isNsfw = true;
  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
  };

  private client = new HttpClient(this.baseUrl);

  async getPopular(page: number): Promise<MangaPageResult> {
    throw new Error("Doujindesu sedang down (SSL Certificate Expired). Server gagal terhubung.");
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    throw new Error("Doujindesu sedang down (SSL Certificate Expired).");
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    throw new Error("Doujindesu sedang down (SSL Certificate Expired).");
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    throw new Error("Doujindesu sedang down (SSL Certificate Expired).");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    return [];
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    return { chapterId, pages: [] };
  }

  getFilters(): FilterList {
    return {
      genres: [],
      formats: [],
      statuses: [],
      sorts: [],
    };
  }
}
