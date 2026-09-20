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
  latestChapterTitle?: string;

  detectedSourceId?: string;
  detectedSourceName?: string;
  isAlternateSource?: boolean;

  detectedAt?: string;
  lastCheckedAt?: string;
  seenAt?: string;
  error?: string;
}
