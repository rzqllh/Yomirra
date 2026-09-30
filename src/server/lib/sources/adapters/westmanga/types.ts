export interface WestMangaGenre {
  id?: number;
  name?: string;
  slug?: string;
}

export interface WestMangaChapterItem {
  id: number;
  content_id?: number;
  number: string | number;
  slug: string;
  updated_at?: {
    time?: number;
    formatted?: string;
  };
  created_at?: {
    time?: number;
    formatted?: string;
  };
}

export interface WestMangaItem {
  id: number;
  title: string;
  slug: string;
  cover: string;
  content_type?: string;
  country_id?: string;
  status?: string;
  hot?: boolean;
  color?: boolean;
  is_project?: boolean;
  is_safe?: boolean;
  total_views?: number;
  rating?: number;
  sinopsis?: string;
  lastChapters?: WestMangaChapterItem[];
}

export interface WestMangaDetail extends WestMangaItem {
  alternative_name?: string;
  author?: string | null;
  release?: number | string;
  bookmark_count?: number;
  genres?: WestMangaGenre[];
  chapters?: WestMangaChapterItem[];
}

export interface WestMangaReaderData {
  id: number;
  number?: string | number;
  title?: string;
  slug: string;
  images: string[];
}

export interface WestMangaApiResponse<T> {
  status?: boolean;
  message?: string;
  data: T;
}
