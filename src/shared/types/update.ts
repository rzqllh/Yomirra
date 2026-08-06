export interface MangaUpdateItem {
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

  detectedAt?: string;
  lastCheckedAt?: string;
  seenAt?: string;
  error?: string;
}
