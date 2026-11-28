import { getReaderHref, getSafeMangaDetailBackHref } from "@/shared/lib/routes";

export function getReaderReturnTo() {
  const value = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("returnTo")
    : null;
  return getSafeMangaDetailBackHref(value);
}

export function isSavedReaderReturnTo(href: string | undefined): href is string {
  return Boolean(href && /^\/catalog\/saved\/[^/?#]+$/.test(href));
}

export function getReaderChapterHref(sourceId: string, mangaId: string, chapterId: string) {
  const returnTo = getReaderReturnTo();
  return getReaderHref(sourceId, mangaId, chapterId, isSavedReaderReturnTo(returnTo) ? returnTo : undefined);
}
