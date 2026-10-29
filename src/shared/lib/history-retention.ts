import type { HistoryItem } from "@/shared/store/history-store";
import { parseChapterNumber } from "./chapter-parser";

export const DETAILED_HISTORY_LIMIT = 512;
export const historyId = (item: Pick<HistoryItem, "sourceId" | "mangaId" | "chapterId">) =>
  `${item.sourceId}::${item.mangaId}::${item.chapterId}`;

export function compareMilestone(a: HistoryItem, b: HistoryItem): number {
  const aNumber = a.chapterNumber ?? parseChapterNumber(a.chapterTitle ?? a.chapterId);
  const bNumber = b.chapterNumber ?? parseChapterNumber(b.chapterTitle ?? b.chapterId);
  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) return aNumber - bNumber;
  if (aNumber !== null && bNumber === null) return 1;
  if (aNumber === null && bNumber !== null) return -1;
  if (a.chapterIndex !== undefined && b.chapterIndex !== undefined && a.chapterIndex !== b.chapterIndex) {
    return a.chapterIndex - b.chapterIndex;
  }
  if (a.chapterId === b.chapterId) return (a.progressPercent ?? 0) - (b.progressPercent ?? 0);
  return 0;
}

export function compactHistoryItem(item: HistoryItem): HistoryItem {
  return {
    sourceId: item.sourceId, mangaId: item.mangaId, chapterId: item.chapterId,
    mangaTitle: item.mangaTitle, chapterTitle: item.chapterTitle,
    savedTitleId: item.savedTitleId, chapterNumber: item.chapterNumber,
    chapterIndex: item.chapterIndex, pageIndex: item.pageIndex, pageOffset: item.pageOffset,
    progressPercent: item.progressPercent, totalPages: item.totalPages,
    readAt: item.readAt, isNsfw: item.isNsfw, isCompact: true,
  };
}

// Preserve a resume cursor and a highest milestone per title outside the detailed window.
// Age alone never expires progress; the inactivity policy has not been approved.
export function retainHistory(
  items: Record<string, HistoryItem>,
  resolveTitle?: (sourceId: string, mangaId: string) => string | null,
): Record<string, HistoryItem> {
  const sorted = Object.values(items).map((item) => {
    const savedTitleId = item.savedTitleId ?? resolveTitle?.(item.sourceId, item.mangaId) ?? undefined;
    const readAt = typeof item.readAt === "number" ? item.readAt : new Date(item.readAt).getTime();
    return { ...item, savedTitleId, readAt: Number.isFinite(readAt) ? readAt : 0 };
  }).sort((a, b) => b.readAt - a.readAt || historyId(a).localeCompare(historyId(b)));
  const retained: Record<string, HistoryItem> = {};
  const summaries = new Map<string, { latest: HistoryItem; highest: HistoryItem }>();
  let detailedCount = 0;
  for (const item of sorted) {
    const id = historyId(item);
    if (!item.isCompact && detailedCount < DETAILED_HISTORY_LIMIT) {
      retained[id] = item;
      detailedCount++;
    }
    const title = item.savedTitleId ?? `${item.sourceId}::${item.mangaId}`;
    const summary = summaries.get(title);
    if (!summary) summaries.set(title, { latest: item, highest: item });
    else if (compareMilestone(item, summary.highest) > 0) summary.highest = item;
  }
  for (const { latest, highest } of summaries.values()) {
    for (const item of [latest, highest]) {
      const id = historyId(item);
      retained[id] ??= compactHistoryItem(item);
    }
  }
  return retained;
}
