import { SourceCapabilities } from "./source-capabilities";

export interface SourceMetadata {
  id: string;
  name: string;
  description?: string;
  language?: string;
  baseUrl?: string;
  icon?: string;
  version?: string;
  adapterVersion?: string; // V1: semantic version of the adapter implementation
  upstreamDomain?: string; // V1: primary upstream domain or API endpoint host
  supportedLanguages?: string[]; // V1: e.g. ["id", "en"]
  isEnabled: boolean;
  isInstalled: boolean;
  capabilities: SourceCapabilities;
  status?: "online" | "slow" | "unavailable" | "unknown" | "in-dev" | "in-fix";
  healthStats?: {
    uptime: string;
    latency: string;
    lastChecked: string;
    message?: string;
  };
  isNsfw: boolean;
  manifestUrl?: string;
  healthCheckUrl?: string;
  reportUrl?: string;
  isDynamic: boolean;
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
  originalTitle?: string;
  author?: string;
  alternativeTitles?: string[];
  language?: string;
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
  isLocked?: boolean; // V1: paywall/early-access boundary indicator
  url?: string; // V1: upstream URL if available
}

export interface ChapterPages {
  chapterId: string;
  pages: PageItem[];
}

export interface PageItem {
  index: number;
  url: string;
  referer?: string; // Some sources require a referer header to bypass hotlink protection
  width?: number; // V1: natural width from upstream if provided
  height?: number; // V1: natural height from upstream if provided
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
  getFilters(): FilterList | Promise<FilterList>;
  // V1 Optional Capabilities
  getRelated?(mangaId: string): Promise<MangaItem[]>;
  resolveDomain?(): Promise<string>;
}
