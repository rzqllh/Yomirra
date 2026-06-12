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

export function getMangaDetailHref(sourceId: string, mangaId: string, returnTo?: string): string {
  const base = `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}`;
  if (returnTo) {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

export function getSafeMangaDetailBackHref(returnTo: string | null, sourceId: string): string {
  // If returnTo exists and is not pointing to a reader route, use it
  if (returnTo && !returnTo.includes('/read/')) {
    return returnTo;
  }
  // Otherwise safe fallback
  return `/`;
}

export function getReaderHref(sourceId: string, mangaId: string, chapterId: string): string {
  return `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}/read/${encodeURIComponent(chapterId)}`;
}

export function getSourceHref(sourceId: string): string {
  // Can be expanded if sources get dedicated detail pages.
  return `/sources?source=${encodeURIComponent(sourceId)}`;
}
