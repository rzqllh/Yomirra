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

export class KomikuAsiaSource implements MangaSource {
  id = "komikuasia";
  name = "Komiku Asia";
  description = "Baca manga bahasa Indonesia di Komiku Asia.";
  language = "id";
  baseUrl = "https://01.komiku.asia";
  version = "1.0.0";
  icon = "https://s2.googleusercontent.com/s2/favicons?domain=komiku.asia&sz=64";
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

  private client = new HttpClient(this.baseUrl, {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://01.komiku.asia",
  });

  async getPopular(page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/manga/?page=${page}&order=popular`);
    return this.parseList(html);
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/manga/?page=${page}&order=update`);
    return this.parseList(html);
  }

  async search(query: string, page: number): Promise<MangaPageResult> {
    const html = await this.client.getHtml(`/page/${page}/`, { s: query });
    return this.parseList(html);
  }

  private parseList(html: string): MangaPageResult {
    const $ = cheerio.load(html);
    const mangas: any[] = [];

    $('.bs').each((i, el) => {
      const title =
        $(el).find('.tt').text().trim() ||
        $(el).find('h2[itemprop="headline"]').text().trim() ||
        $(el).find('.tt h2').text().trim();
      const slug = $(el).find('a').attr('href') || '';
      const id = slug.replace(this.baseUrl, '').replace('/manga/', '').replace(/\//g, '');
      const coverUrl =
        $(el).find('img').attr('src') ||
        $(el).find('img').attr('data-src') ||
        '';
      const latestChapter =
        $(el).find('.epxs').text().trim() ||
        $(el).find('.chapter').text().trim() ||
        '';
      const isManga =
        $(el).find('.type').attr('class')?.replace('type', '').trim() || 'Manga';

      if (id && title) {
        mangas.push({
          id,
          title,
          coverUrl: coverUrl.split('?')[0],
          latestChapter,
          format: isManga,
        });
      }
    });

    const hasNextPage =
      $('.hpage a.r').length > 0 || $('.pagination .next').length > 0;

    return { mangas, hasNextPage };
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const html = await this.client.getHtml(`/manga/${mangaId}/`);
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim();
    const coverUrl =
      $('.thumb img').attr('src') || $('.thumb img').attr('data-src') || '';
    const description =
      $('.entry-content[itemprop="description"]').text().trim() ||
      $('.desc p').text().trim();

    let author = 'Unknown';
    let statusStr = 'Unknown';

    $('.imptdt').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('status')) {
        statusStr = $(el).text().replace(/status/i, '').trim();
      }
    });

    $('.fmed').each((i, el) => {
      const text = $(el).find('b').text().toLowerCase();
      if (text.includes('author')) {
        author = $(el).find('span').text().trim();
      }
    });

    const status = statusStr.toLowerCase().includes('ongoing') ? 'ONGOING' : 'COMPLETED';

    const genres: string[] = [];
    $('.mgen a').each((i, el) => {
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
    const html = await this.client.getHtml(`/manga/${mangaId}/`);
    const $ = cheerio.load(html);

    const chapters: Chapter[] = [];
    $('#chapterlist li').each((i, el) => {
      const chapterUrl = $(el).find('a').attr('href') || '';
      const id = chapterUrl.replace(this.baseUrl, '').replace(/\//g, '');
      const title = $(el).find('.chapternum').text().trim();
      const date = $(el).find('.chapterdate').text().trim();

      const numMatch = title.match(/[\d.]+/);
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
    const html = await this.client.getHtml(`/${chapterId}/`);
    const $ = cheerio.load(html);

    const pages: any[] = [];
    $('#readerarea img').each((i, el) => {
      const src =
        $(el).attr('src') ||
        $(el).attr('data-src') ||
        $(el).attr('data-lazy-src');
      if (src && !src.includes('lazyload')) {
        pages.push({
          index: i,
          url: src,
          referer: this.baseUrl,
        });
      }
    });

    return { chapterId, pages };
  }

  getFilters(): FilterList {
    return {
      genres: [],
      formats: [],
      statuses: [
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
      ],
      sorts: [
        { id: "popular", name: "Populer" },
        { id: "update", name: "Terbaru" },
      ],
    };
  }
}
