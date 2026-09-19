export interface KomikuIIComicsListResponse {
  items: KomikuIIItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface KomikuIIItem {
  id: number;
  slug: string;
  title: string;
  alt?: string;
  type?: string;
  genres?: string[];
  status?: string;
  author?: string;
  artist?: string;
  rating?: number;
  chapterCount?: number;
  latestChapter?: number | string;
  latestChapterAt?: number;
  views?: number;
  updatedHoursAgo?: number;
  addedHoursAgo?: number;
  hue?: [number, number];
  coverUrl: string;
}

export interface KomikuIIDetail extends KomikuIIItem {
  synopsis?: string;
}

export interface KomikuIIChapterItem {
  id: number;
  n: number | string;
  title?: string;
  releasedLabel?: string;
  releasedAt?: number;
}

export interface KomikuIIChapterPagesResponse {
  id: number;
  comicId: number;
  n?: number | string;
  title?: string;
  releasedLabel?: string;
  releasedAt?: number;
  pages: {
    index?: number;
    url: string;
  }[];
}

export interface KomikuIIFiltersResponse {
  genres: string[];
  statuses: string[];
  types: string[];
  authors?: string[];
}
