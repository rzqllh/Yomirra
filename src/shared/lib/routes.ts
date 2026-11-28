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

export function getAccountHref(): string {
  return `/account`;
}

/** Stable entry point for a user's verified saved-title catalog identity. */
export function getCanonicalSavedDetailHref(savedTitleId: string): string {
  return `/catalog/saved/${encodeURIComponent(savedTitleId)}`;
}

export function getMangaDetailHref(sourceId: string, mangaId: string, returnTo?: string): string {
  const base = `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}`;
  if (returnTo) {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

export function getSafeMangaDetailBackHref(returnTo: string | null): string | undefined {
  if (!returnTo) return undefined;

  // Back targets are internal app routes only. Reader routes are explicitly
  // excluded so leaving detail never walks back into the reader stack.
  if (!returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.includes("\\")) return undefined;

  const appOrigin = "https://yomirra.invalid";
  try {
    const url = new URL(returnTo, appOrigin);
    if (url.origin === appOrigin && !url.pathname.startsWith("//") && !url.pathname.includes("/read/")) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function getReaderHref(sourceId: string, mangaId: string, chapterId: string, returnTo?: string): string {
  const base = `/manga/${encodeURIComponent(sourceId)}/${encodeURIComponent(mangaId)}/read/${encodeURIComponent(chapterId)}`;
  if (returnTo) {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

export function getSourceHref(sourceId: string): string {
  // Can be expanded if sources get dedicated detail pages.
  return `/sources?source=${encodeURIComponent(sourceId)}`;
}
