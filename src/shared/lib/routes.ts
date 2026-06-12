/**
 * Shared routing helpers to ensure consistent navigation across the app.
 */

export function getHomeHref(): string {
  return `/`;
}

export function getLibraryHref(): string {
  return `/library`;
}

export function getBookmarkHref(): string {
  return `/bookmark`;
}

export function getSearchHref(query?: string): string {
  if (query) {
    return `/search?q=${encodeURIComponent(query)}`;
  }
  return `/search`;
}

export function getSourcesHref(): string {
  return `/sources`;
}

export function getSettingsHref(): string {
  return `/settings`;
}

export function getMangaDetailHref(sourceId: string, mangaId: string): string {
  return `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}`;
}

export function getReaderHref(sourceId: string, mangaId: string, chapterId: string): string {
  return `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}/read/${encodeURIComponent(chapterId)}`;
}

export function getSourceHref(sourceId: string): string {
  // Can be expanded if sources get dedicated detail pages.
  return `/sources?source=${encodeURIComponent(sourceId)}`;
}
