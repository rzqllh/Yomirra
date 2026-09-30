export type AnnouncementType = 'info' | 'warning' | 'alert';

export interface SiteAnnouncement {
  enabled: boolean;
  message: string;
  type: AnnouncementType;
  link?: string;
  id: string; // unique identifier used for tracking session dismissals
}

export interface MaintenanceModeConfig {
  enabled: boolean;
  message?: string;
  bypassToken?: string;
}

export interface PinnedSpotlightItem {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
}

export interface SiteFeatureFlags {
  semanticSearchEnabled: boolean;
  sourceFallbackAutoSwitch: boolean;
  telegramAlertsEnabled: boolean;
  dataSaverDefault: boolean;
}

export interface SiteConfig {
  announcement: SiteAnnouncement;
  maintenanceMode: MaintenanceModeConfig;
  spotlight: {
    pinnedManga: PinnedSpotlightItem[];
  };
  features: SiteFeatureFlags;
  updatedAt: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  announcement: {
    enabled: false,
    message: "",
    type: "info",
    id: "announcement-default",
  },
  maintenanceMode: {
    enabled: false,
    message: "Yomirra sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan kembali beberapa saat lagi.",
  },
  spotlight: {
    pinnedManga: [],
  },
  features: {
    semanticSearchEnabled: true,
    sourceFallbackAutoSwitch: true,
    telegramAlertsEnabled: true,
    dataSaverDefault: false,
  },
  updatedAt: new Date(0).toISOString(),
};
