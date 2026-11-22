import type { SourceCapabilities } from "@/shared/sources/source-capabilities";

export type SourceCategory = "SFW" | "MIXED" | "NSFW";

export interface BaseEngineConfig {
  id: string;
  name: string;
  description?: string;
  language?: string;
  baseUrl: string;
  upstreamDomain?: string;
  category: SourceCategory;
  isNsfw: boolean;
  icon?: string;
  version?: string;
  adapterVersion?: string;
  supportedLanguages?: string[];
  capabilities?: Partial<SourceCapabilities>;
  mangaPath?: string;
  chapterPath?: string;
  isEnabled?: boolean;
  status?: "online" | "slow" | "degraded" | "unavailable" | "unknown" | "in-dev" | "in-fix";
}

export interface MangaThemesiaConfig extends BaseEngineConfig {
  /** Custom selector overrides for non-standard MangaThemesia variants */
  itemSelector?: string;
  readerAreaSelector?: string;
}

export interface NatsuIdConfig extends BaseEngineConfig {
  searchAction?: string;
  chapterAction?: string;
}

export interface MadaraConfig extends BaseEngineConfig {
  itemSelector?: string;
}

export interface GenericWpConfig extends BaseEngineConfig {
  seriesPathRegex?: RegExp;
}
