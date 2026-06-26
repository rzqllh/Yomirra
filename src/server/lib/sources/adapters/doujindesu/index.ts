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
  baseUrl = "https://doujindesu.ws";
  version = "1.0.0";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=doujindesu.ws&sz=64";
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
    throw new Error("Doujindesu: SSL Certificate Expired atau Server Down.");
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    throw new Error("Doujindesu: SSL Certificate Expired atau Server Down.");
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    throw new Error("Doujindesu: SSL Certificate Expired atau Server Down.");
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    throw new Error("Doujindesu: SSL Certificate Expired atau Server Down.");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("Doujindesu: SSL Certificate Expired atau Server Down.");
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    throw new Error("Doujindesu: SSL Certificate Expired atau Server Down.");
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
