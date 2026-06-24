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

export class ProjectAlphaSource implements MangaSource {
  id = "project-alpha";
  name = "project-alpha";
  baseUrl = "https://doujindesu.ws";
  private client = new HttpClient(this.baseUrl);

  async getPopular(page: number): Promise<MangaPageResult> {
    throw new Error("project-alpha: Sedang dalam tahap pengembangan adapter.");
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    throw new Error("project-alpha: Sedang dalam tahap pengembangan adapter.");
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    throw new Error("project-alpha: Sedang dalam tahap pengembangan adapter.");
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    throw new Error("project-alpha: Sedang dalam tahap pengembangan adapter.");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("project-alpha: Sedang dalam tahap pengembangan adapter.");
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    throw new Error("project-alpha: Sedang dalam tahap pengembangan adapter.");
  }

  getFilters(): FilterList {
    return {
      status: {
        type: "select",
        name: "Status",
        options: [
          { label: "Semua", value: "" },
          { label: "Ongoing", value: "ongoing" },
          { label: "Completed", value: "completed" },
        ],
      },
    };
  }
}
