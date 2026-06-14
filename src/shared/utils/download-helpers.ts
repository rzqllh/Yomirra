export function getDownloadChapterId(sourceId: string, mangaId: string, chapterId: string): string {
  // Safe encoding to prevent characters like / ? # from breaking the URL or key
  return `${encodeURIComponent(sourceId)}::${encodeURIComponent(mangaId)}::${encodeURIComponent(chapterId)}`;
}

export function getOfflineImageUrl(params: {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  pageIndex: number;
}): string {
  const chapterKey = getDownloadChapterId(params.sourceId, params.mangaId, params.chapterId);
  return `/offline-images/${chapterKey}/${params.pageIndex}`;
}
