export interface DoujinGenre {
  id?: number;
  name?: string;
  slug?: string;
}

export interface DoujinChapterItem {
  id: string;
  chapter_number: number | string;
  created_at?: string;
}

export interface DoujinMangaItem {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  status?: string;
  type?: string;
  rating?: number;
  views?: number;
  description?: string;
  sinopsis?: string;
  created_at?: string;
  updated_at?: string;
  chapters?: DoujinChapterItem[];
  manga_genres?: Array<{
    genres?: DoujinGenre;
  }>;
}

export interface DoujinMangaDetail extends DoujinMangaItem {
  author?: string;
  artist?: string;
  banner_url?: string;
}

export interface DoujinChapterDetail {
  id: string;
  chapter_number: number | string;
  title?: string;
  manga_id?: string;
  manga_title?: string;
  manga_slug?: string;
  content_urls: string[];
}
