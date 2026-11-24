export interface MangaUpdateItem {
  savedTitleId?: string;
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  coverUrl?: string;
  sourceName?: string;

  lastKnownChapterId?: string;
  lastKnownChapterNumber?: number;
  lastKnownChapterTitle?: string;

  latestChapterId?: string;
  latestChapterNumber?: number;
  /** Explicit volume-local numbering; absent on legacy/global cursors. */
  latestChapterVolume?: number;
  latestChapterTitle?: string;

  detectedSourceId?: string;
  detectedSourceName?: string;
  isAlternateSource?: boolean;

  detectedAt?: string;
  lastCheckedAt?: string;
  seenAt?: string;
  error?: string;
}
