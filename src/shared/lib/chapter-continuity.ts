type ChapterIdentity = {
  id: string;
  isLocked?: boolean;
};

type ReadingAnchor = {
  chapterId: string;
  progressPercent?: number;
};

function decodeStableId(value?: string): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function resolveChapterAnchorIndex(
  chapters: ChapterIdentity[],
  chapterId?: string
): number {
  if (!chapterId) return -1;
  const target = decodeStableId(chapterId);
  return chapters.findIndex(
    (chapter) =>
      chapter.id === chapterId || decodeStableId(chapter.id) === target
  );
}

/**
 * Chapter arrays in Yomirra adapters are newest-first. Continue stays on the
 * last-opened stable chapter ID until progress is effectively complete; then
 * it advances one step toward the newer chapter when that chapter is usable.
 */
export function resolveContinueChapterId(
  chapters: ChapterIdentity[],
  reading?: ReadingAnchor,
  completedThreshold = 95
): string | undefined {
  if (!reading?.chapterId) return undefined;

  const currentIndex = resolveChapterAnchorIndex(chapters, reading.chapterId);
  if (currentIndex < 0) return reading.chapterId;

  const progress = reading.progressPercent ?? 0;
  if (progress < completedThreshold || currentIndex === 0) {
    return chapters[currentIndex]?.id ?? reading.chapterId;
  }

  const nextChapter = chapters[currentIndex - 1];
  if (!nextChapter || nextChapter.isLocked) {
    return chapters[currentIndex]?.id ?? reading.chapterId;
  }

  return nextChapter.id;
}
