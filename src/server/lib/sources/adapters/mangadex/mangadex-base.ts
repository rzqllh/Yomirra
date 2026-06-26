import type {
  Chapter,
  ChapterPages,
  MangaDetail,
  MangaItem,
  MangaPageResult,
  MangaSource,
  FilterList,
} from "@/shared/sources/source-types";
import { HttpClient } from "../base/http-client";

interface MangaDexResponse<T> {
  result: "ok" | "error";
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

interface MangaDexEntity {
  id: string;
  type: string;
  attributes: any;
  relationships: MangaDexRelationship[];
}

interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: any;
}

export abstract class MangaDexBase implements MangaSource {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract language: string;
  abstract isNsfw: boolean;
  abstract contentRatings: string[];

  baseUrl = "https://api.mangadex.org";
  version = "1.0.0";
  icon = "https://mangadex.org/favicon.ico";
  isEnabled = true;
  isInstalled = true;
  status = "online" as const;
  
  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
  };

  protected client = new HttpClient(this.baseUrl);

  private getCoverUrl(mangaId: string, relationships: MangaDexRelationship[]): string {
    const coverRel = relationships?.find((r) => r.type === "cover_art");
    if (coverRel && coverRel.attributes?.fileName) {
      return `https://uploads.mangadex.org/covers/${mangaId}/${coverRel.attributes.fileName}.512.jpg`;
    }
    return "";
  }

  private parseMangaList(response: MangaDexResponse<MangaDexEntity[]>): MangaPageResult {
    const mangas: MangaItem[] = response.data.map((manga) => {
      const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || "Unknown Title";
      const coverUrl = this.getCoverUrl(manga.id, manga.relationships);
      
      return {
        id: manga.id,
        title: title as string,
        coverUrl,
        status: manga.attributes.status?.toUpperCase(),
        format: "Manga",
      };
    });

    return {
      mangas,
      hasNextPage: (response.offset || 0) + (response.limit || 0) < (response.total || 0),
    };
  }

  async getPopular(page: number): Promise<MangaPageResult> {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const params: Record<string, any> = {
      limit,
      offset,
      "order[followedCount]": "desc",
      "includes[]": ["cover_art"],
      "contentRating[]": this.contentRatings,
    };

    const res = await this.client.get<MangaDexResponse<MangaDexEntity[]>>("/manga", params);
    return this.parseMangaList(res);
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const params: Record<string, any> = {
      limit,
      offset,
      "order[latestUploadedChapter]": "desc",
      "includes[]": ["cover_art"],
      "contentRating[]": this.contentRatings,
    };

    const res = await this.client.get<MangaDexResponse<MangaDexEntity[]>>("/manga", params);
    return this.parseMangaList(res);
  }

  async search(query: string, page: number, filters?: Record<string, string | string[]>): Promise<MangaPageResult> {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const params: Record<string, any> = {
      limit,
      offset,
      "includes[]": ["cover_art"],
      "contentRating[]": this.contentRatings,
    };

    if (query) {
      params.title = query;
    }

    if (filters) {
      if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
        const supportedGenres = this.getFilters().genres || [];
        const uuidGenres = filters.genres
          .map(g => supportedGenres.find(sg => sg.name.toLowerCase() === g.toLowerCase())?.id)
          .filter(Boolean);
        
        if (uuidGenres.length > 0) {
          params["includedTags[]"] = uuidGenres;
        }
      }
      if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
        params["status[]"] = filters.statuses;
      }
      if (filters.formats && Array.isArray(filters.formats) && filters.formats.length > 0) {
        params["publicationDemographic[]"] = filters.formats;
      }
    }

    const res = await this.client.get<MangaDexResponse<MangaDexEntity[]>>("/manga", params);
    return this.parseMangaList(res);
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    const params = {
      "includes[]": ["cover_art", "author", "artist"],
    };

    const res = await this.client.get<MangaDexResponse<MangaDexEntity>>(`/manga/${mangaId}`, params);
    const manga = res.data;

    const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || "Unknown Title";
    const description = manga.attributes.description?.en || Object.values(manga.attributes.description || {})[0] || "No description available.";
    const coverUrl = this.getCoverUrl(manga.id, manga.relationships);
    
    let author = "Unknown";
    let artist = "Unknown";

    manga.relationships?.forEach(rel => {
      if (rel.type === "author" && rel.attributes?.name) {
        author = rel.attributes.name;
      }
      if (rel.type === "artist" && rel.attributes?.name) {
        artist = rel.attributes.name;
      }
    });

    const genres = manga.attributes.tags
      ?.map((tag: any) => tag.attributes?.name?.en)
      .filter(Boolean) || [];

    let status: MangaDetail["status"] = "UNKNOWN";
    const sourceStatus = manga.attributes.status?.toLowerCase();
    if (sourceStatus === "ongoing") status = "ONGOING";
    else if (sourceStatus === "completed") status = "COMPLETED";
    else if (sourceStatus === "cancelled") status = "CANCELLED";

    return {
      id: manga.id,
      title: title as string,
      coverUrl,
      description: description as string,
      author,
      artist,
      genres,
      status,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const limit = 500;
    
    // We only fetch en and id languages for chapters
    const languages = ["en", "id"];

    const params: Record<string, any> = {
      limit,
      "order[chapter]": "desc",
      "translatedLanguage[]": languages,
      "contentRating[]": this.contentRatings,
    };

    const res = await this.client.get<MangaDexResponse<MangaDexEntity[]>>(`/manga/${mangaId}/feed`, params);
    
    const chapters: Chapter[] = res.data.map(ch => {
      const numStr = ch.attributes.chapter;
      const number = numStr ? parseFloat(numStr) : 0;
      
      let title = ch.attributes.title || `Chapter ${numStr || "?"}`;
      
      // If there's a language, prefix or suffix it? We can just append it for clarity.
      if (ch.attributes.translatedLanguage && ch.attributes.translatedLanguage !== "en") {
        title = `[${ch.attributes.translatedLanguage.toUpperCase()}] ${title}`;
      }

      return {
        id: ch.id,
        mangaId,
        number,
        title,
        date: ch.attributes.publishAt,
        scanlator: "MangaDex", // We could fetch scanlation group, but it requires another include
      };
    });

    return chapters;
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    const res = await this.client.get<any>(`/at-home/server/${chapterId}`);
    
    const baseUrl = res.baseUrl;
    const hash = res.chapter.hash;
    const data = res.chapter.data; // High quality images

    const pages = data.map((filename: string, index: number) => ({
      index,
      url: `${baseUrl}/data/${hash}/${filename}`,
    }));

    return {
      chapterId,
      pages,
    };
  }

  getFilters(): FilterList {
    return {
      genres: [
        // A subset of popular MangaDex tags
        { id: "391b0423-d847-456f-aff0-8b0cfc03066b", name: "Action" },
        { id: "87cc87cd-a395-47af-b27a-93258283bbc6", name: "Adventure" },
        { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", name: "Comedy" },
        { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", name: "Drama" },
        { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", name: "Fantasy" },
        { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", name: "Romance" },
        { id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75", name: "Sci-Fi" },
        { id: "ee968100-4191-4968-93d3-f82d72be7e46", name: "Mystery" },
      ],
      formats: [
        { id: "shounen", name: "Shounen" },
        { id: "shoujo", name: "Shoujo" },
        { id: "seinen", name: "Seinen" },
        { id: "josei", name: "Josei" },
      ],
      statuses: [
        { id: "ongoing", name: "Ongoing" },
        { id: "completed", name: "Completed" },
        { id: "hiatus", name: "Hiatus" },
        { id: "cancelled", name: "Cancelled" },
      ],
      sorts: [],
    };
  }
}
