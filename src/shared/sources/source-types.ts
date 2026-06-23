import { SourceCapabilities } from "./source-capabilities";

export interface SourceMetadata {
  id: string;
  name: string;
  description?: string;
  language?: string;
  baseUrl?: string;
  icon?: string;
  version?: string;
  isEnabled: boolean;
  isInstalled: boolean;
  capabilities: SourceCapabilities;
  status?: "online" | "slow" | "unavailable" | "unknown";
  healthStats?: {
    uptime: string;
    latency: string;
    lastChecked: string;
    message?: string;
  };
  isNsfw: boolean;
  manifestUrl?: string;
}

export interface MangaPageResult {
  mangas: MangaItem[];
  hasNextPage: boolean;
}

export interface MangaItem {
  id: string;
  title: string;
  coverUrl: string;
  status?: string;
  format?: string;
  latestChapter?: string;
  latestChapterTime?: string;
  rank?: number;
  score?: number;
  description?: string;
}

export interface MangaDetail extends MangaItem {
  author?: string;
  artist?: string;
  description: string;
  genres: string[];
  status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN";
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  date: string;
  scanlator?: string;
}

export interface ChapterPages {
  chapterId: string;
  pages: PageItem[];
}

export interface PageItem {
  index: number;
  url: string;
  referer?: string; // Some sources require a referer header to bypass hotlink protection
}

export interface SourceFilter {
  id: string;
  name: string;
}

export interface FilterList {
  genres: SourceFilter[];
  formats: SourceFilter[];
  statuses: SourceFilter[];
  sorts: SourceFilter[];
}

export interface MangaSource extends SourceMetadata {
  getPopular(page: number): Promise<MangaPageResult>;
  getLatest(page: number): Promise<MangaPageResult>;
  search(query: string, page: number, filters?: Record<string, string | string[]>): Promise<MangaPageResult>;
  getDetail(mangaId: string): Promise<MangaDetail>;
  getChapters(mangaId: string): Promise<Chapter[]>;
  getPages(chapterId: string): Promise<ChapterPages>;
  getFilters(): FilterList;
}
