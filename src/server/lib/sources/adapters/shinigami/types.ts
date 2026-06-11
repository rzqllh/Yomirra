export interface ShinigamiPaginationMeta {
  page: number;
  page_size: number;
  total_page: number;
  total_data: number;
}

export interface ShinigamiMangaItem {
  manga_id: string;
  title: string;
  cover_image_url?: string;
  cover_portrait_url?: string;
  status?: number;
  latest_chapter_number?: number | string;
  latest_chapter_time?: string;
  taxonomy?: {
    Format?: Array<{ name: string; slug: string }>;
  };
}

export interface ShinigamiMangaListResponse {
  data: ShinigamiMangaItem[];
  meta: ShinigamiPaginationMeta;
}

export interface ShinigamiMangaDetail {
  manga_id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  cover_portrait_url?: string;
  status: number;
  author: string;
  artist: string;
  genres: Array<{ id: number; name: string }>;
}

export interface ShinigamiMangaDetailResponse {
  data: ShinigamiMangaDetail;
}

export interface ShinigamiChapterItem {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  release_date: string;
}

export interface ShinigamiChapterListResponse {
  data: ShinigamiChapterItem[];
}

export interface ShinigamiChapterData {
  path: string;
  data: string[];
}

export interface ShinigamiChapterPages {
  base_url: string;
  chapter: ShinigamiChapterData;
  prev_chapter_id: string | null;
  next_chapter_id: string | null;
}

export interface ShinigamiChapterPagesResponse {
  data: ShinigamiChapterPages;
}
