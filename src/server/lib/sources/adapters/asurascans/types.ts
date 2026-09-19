export interface AsuraGenreItem {
  id: number;
  name: string;
  slug: string;
}

export interface AsuraLatestChapter {
  id: number;
  number: number;
  slug: string;
  page_count?: number;
  is_premium?: boolean;
  early_access_until?: string;
  published_at?: string;
}

export interface AsuraSeriesItem {
  id: number;
  slug: string;
  title: string;
  description?: string;
  cover: string;
  status?: string;
  type?: string;
  popularity_rank?: number;
  bookmark_count?: number;
  rating?: number;
  chapter_count?: number;
  last_chapter_at?: string;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  public_url?: string;
  source_url?: string;
  genres?: AsuraGenreItem[];
  latest_chapters?: AsuraLatestChapter[];
}

export interface AsuraSeriesListResponse {
  data: AsuraSeriesItem[];
  meta: {
    total: number;
    per_page: number;
    has_more: boolean;
  };
}

export interface AsuraSeriesDetailResponse {
  series: AsuraSeriesItem;
  recommended_series?: AsuraSeriesItem[];
}

export interface AsuraChapterItem {
  id: number;
  series_id: number;
  number: number;
  slug: string;
  page_count?: number;
  is_premium?: boolean;
  is_locked?: boolean;
  comments_enabled?: boolean;
  early_access_until?: string;
  published_at?: string;
  created_at?: string;
  view_count?: number;
  series_slug?: string;
}

export interface AsuraChaptersResponse {
  data: AsuraChapterItem[];
}

export interface AsuraPageItem {
  url: string;
  width?: number;
  height?: number;
}

export interface AsuraChapterReadResponse {
  data: {
    is_locked?: boolean;
    unlock_time?: string;
    chapter?: {
      id?: number;
      series_id?: number;
      number?: number;
      slug?: string;
      pages?: AsuraPageItem[];
    } | null;
  };
}

export interface AsuraGenresResponse {
  data: AsuraGenreItem[];
}
