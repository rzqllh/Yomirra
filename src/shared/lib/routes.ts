/**
 * Shared routing helpers to ensure consistent navigation across the app.
 */

export function getMangaDetailHref(sourceId: string, mangaId: string): string {
  return `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}`;
}

export function getReaderHref(sourceId: string, mangaId: string, chapterId: string): string {
  return `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}/read/${encodeURIComponent(chapterId)}`;
}

export function getSourceHref(sourceId: string): string {
  // Can be expanded if sources get dedicated detail pages.
  // For now, it might jump to a browse page filter.
  return `/sources?source=${encodeURIComponent(sourceId)}`;
}
