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

export class ManhwadesuSource implements MangaSource {
  id = "manhwadesu";
  name = "Manhwadesu";
  description = "Baca Manhwa Bahasa Indonesia";
  language = "id";
  baseUrl = "https://manhwadesu.cx"; // May change over time
  version = "1.0.0";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=manhwadesu.cx&sz=64";
  isEnabled = true;
  isInstalled = true;
  status = "online" as const;
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
    throw new Error("Manhwadesu: Sedang dalam tahap pengembangan adapter.");
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    throw new Error("Manhwadesu: Sedang dalam tahap pengembangan adapter.");
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    throw new Error("Manhwadesu: Sedang dalam tahap pengembangan adapter.");
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    throw new Error("Manhwadesu: Sedang dalam tahap pengembangan adapter.");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("Manhwadesu: Sedang dalam tahap pengembangan adapter.");
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    throw new Error("Manhwadesu: Sedang dalam tahap pengembangan adapter.");
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
