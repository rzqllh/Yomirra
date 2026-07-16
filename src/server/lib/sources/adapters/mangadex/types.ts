// MangaDex API v5 response types

export interface MangaDexResponse<T> {
  result: "ok" | "error";
  response: string;
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

export interface MangaDexListResponse<T> {
  result: "ok" | "error";
  response: string;
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

// --- Manga ---

export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface MangaDexLocalizedString {
  [lang: string]: string;
}

export interface MangaDexTagAttributes {
  name: MangaDexLocalizedString;
  group: "genre" | "theme" | "format" | "content";
}

export interface MangaDexTag {
  id: string;
  type: "tag";
  attributes: MangaDexTagAttributes;
}

export interface MangaDexMangaAttributes {
  title: MangaDexLocalizedString;
  altTitles: MangaDexLocalizedString[];
  description: MangaDexLocalizedString;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  year: number | null;
  contentRating: "safe" | "suggestive" | "erotica" | "pornographic";
  tags: MangaDexTag[];
  originalLanguage: string;
  publicationDemographic: "shounen" | "shoujo" | "josei" | "seinen" | null;
  lastChapter: string | null;
  lastVolume: string | null;
}

export interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: MangaDexMangaAttributes;
  relationships: MangaDexRelationship[];
}

// --- Chapter ---

export interface MangaDexChapterAttributes {
  title: string | null;
  volume: string | null;
  chapter: string | null;
  translatedLanguage: string;
  publishAt: string;
  readableAt: string;
  pages: number;
}

export interface MangaDexChapter {
  id: string;
  type: "chapter";
  attributes: MangaDexChapterAttributes;
  relationships: MangaDexRelationship[];
}

// --- At-Home (Pages) ---

export interface MangaDexAtHomeResponse {
  result: "ok";
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

// --- Cover ---

export interface MangaDexCoverAttributes {
  fileName: string;
  volume: string | null;
}

// --- Tag ---

export type MangaDexTagListResponse = MangaDexListResponse<MangaDexTag>;
export type MangaDexMangaListResponse = MangaDexListResponse<MangaDexManga>;
export type MangaDexChapterListResponse = MangaDexListResponse<MangaDexChapter>;
export type MangaDexMangaResponse = MangaDexResponse<MangaDexManga>;

// --- Statistics (Rating) ---

export interface MangaDexStatisticsResponse {
  result: "ok";
  statistics: Record<string, {
    rating: {
      average: number | null;
      bayesian: number | null;
    };
    follows: number;
  }>;
}
