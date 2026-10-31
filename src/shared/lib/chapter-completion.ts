/** Q90: only successfully decoded pages may verify a chapter completion. */
export function canCompleteChapter(
  pages: ReadonlyArray<{ url: string }>,
  loadedPositions: ReadonlySet<number>,
  failedPageIndices: ReadonlySet<number>
): boolean {
  if (pages.length === 0 || failedPageIndices.size > 0) return false;
  return pages.every((page, position) => Boolean(page.url) && loadedPositions.has(position));
}
