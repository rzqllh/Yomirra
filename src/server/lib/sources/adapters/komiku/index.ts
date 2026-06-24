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

export class KomikuSource implements MangaSource {
  id = "komiku";
  name = "Komiku";
  description = "Baca Komik, Manga, dan Manhwa";
  language = "id";
  baseUrl = "https://komiku.org";
  version = "1.0.0";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=komiku.org&sz=64";
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

  private client = new HttpClient(this.baseUrl);

  async getPopular(page: number): Promise<MangaPageResult> {
    const url = `/pustaka/?orderby=meta_value_num`;
    const html = await this.client.getHtml(url);
    const $ = cheerio.load(html);
    return this.parseList($);
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const url = `/pustaka/?orderby=modified`;
    const html = await this.client.getHtml(url);
    const $ = cheerio.load(html);
    return this.parseList($);
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/cari/?post_type=manga&s=${encodeURIComponent(query)}`);
    const $ = cheerio.load(html);
    return this.parseList($);
  }

  private parseList($: cheerio.CheerioAPI): MangaPageResult {
    const mangas: any[] = [];
    $(".bge, .bgei").each((i, el) => {
      const title = $(el).find("h3").text().trim();
      const slug = $(el).find("h3 a").attr("href")?.replace(this.baseUrl, "") || "";
      const id = slug.replace("/manga/", "").replace(/\//g, "");
      const coverUrl = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
      
      let latestChapter = "";
      const chapterEl = $(el).find(".new1");
      if (chapterEl.length) {
        latestChapter = chapterEl.text().trim();
      } else {
        latestChapter = $(el).find(".ls2l").text().trim();
      }
      
      const isManga = $(el).find(".tpe1_inf b").text().trim() || $(el).attr("data-tipe") || "Manga";

      if (id && title) {
        mangas.push({
          id,
          title,
          coverUrl: coverUrl.split("?")[0], // Remove resize params for better quality
          latestChapter,
          format: isManga,
        });
      }
    });

    return {
      mangas,
      hasNextPage: false, // Komiku pagination is complex, default to false for now
    };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const url = `/manga/${mangaId}/`;
    const html = await this.client.getHtml(url);
    const $ = cheerio.load(html);

    const title = $('#Judul h1').text().trim() || $('h1[itemprop="name"]').text().trim();
    const coverUrl = $('.ims img').attr('src') || '';
    const description = $('#Sinopsis p').text().trim() || $('p[itemprop="description"]').text().trim() || "Tidak ada sinopsis";
    
    let author = 'Unknown';
    let statusStr = 'Unknown';
    
    $('table.inftable tr').each((i, el) => {
      const rowText = $(el).text().toLowerCase();
      if (rowText.includes('pengarang') || rowText.includes('author')) {
        author = $(el).find('td:nth-child(2)').text().trim();
      }
      if (rowText.includes('status')) {
        statusStr = $(el).find('td:nth-child(2)').text().trim();
      }
    });

    const status = statusStr.toLowerCase().includes('ongoing') ? 'ONGOING' : 'COMPLETED';

    const genres: string[] = [];
    $('.genre li a').each((i, el) => {
      genres.push($(el).text().trim());
    });

    return {
      id: mangaId,
      title,
      coverUrl: coverUrl.split('?')[0],
      description,
      author,
      genres,
      status,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const url = `/manga/${mangaId}/`;
    const html = await this.client.getHtml(url);
    const $ = cheerio.load(html);

    const chapters: Chapter[] = [];
    $('#Daftar_Chapter tbody tr').each((i, el) => {
      const numText = $(el).find('.tengah').text().trim();
      if (!numText) return; // Skip header row
      
      const title = $(el).find('.judulseries a').text().trim();
      const slug = $(el).find('.judulseries a').attr('href') || "";
      const id = slug.replace(this.baseUrl, "").replace(/\//g, "");
      const date = $(el).find('.tanggalseries').text().trim();
      
      const numMatch = numText.match(/[\d.]+/);
      const number = numMatch ? parseFloat(numMatch[0]) : 0;

      if (id) {
        chapters.push({
          id,
          mangaId,
          number,
          title,
          date,
        });
      }
    });

    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const url = `/${chapterId}/`;
    const html = await this.client.getHtml(url);
    const $ = cheerio.load(html);

    const pages: any[] = [];
    $('#baca-komik img, .baca-komik img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('lazyload')) {
        pages.push({
          index: i,
          url: src,
          referer: this.baseUrl,
        });
      }
    });

    return {
      chapterId,
      pages,
    };
  }

  getFilters(): FilterList {
    return {
      genres: [],
      formats: [],
      statuses: [
        { id: "", name: "Semua" },
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
      ],
      sorts: [],
    };
  }
}
