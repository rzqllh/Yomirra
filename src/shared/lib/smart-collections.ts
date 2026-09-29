import type { HistoryItem } from "@/shared/store/history-store";
import type { LibraryItem } from "@/shared/store/library-store";

const DAY_MS = 24 * 60 * 60 * 1000;

export type SmartCollectionId =
  | "continue-reading"
  | "unread"
  | "recently-added"
  | "highly-rated"
  | "stale"
  | "completed-unfinished"
  | "format-manga"
  | "format-manhwa"
  | "format-manhua";

export interface SmartCollection {
  id: SmartCollectionId;
  label: string;
  items: LibraryItem[];
}

export interface SmartCollectionOptions {
  now?: number;
  recentDays?: number;
  staleDays?: number;
  highRatingThreshold?: number;
}

function timestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function libraryRefs(item: LibraryItem): string[] {
  const refs = new Set<string>([
    `${item.sourceId}::${item.mangaId}`,
  ]);

  if (item.id) refs.add(item.id);
  if (item.primarySourceId && item.primaryMangaId) {
    refs.add(`${item.primarySourceId}::${item.primaryMangaId}`);
  }
  for (const linked of item.linkedSources ?? []) {
    refs.add(`${linked.sourceId}::${linked.mangaId}`);
  }

  return Array.from(refs);
}

function latestHistoryByKey(historyItems: HistoryItem[]): Map<string, HistoryItem> {
  const result = new Map<string, HistoryItem>();

  const keepLatest = (key: string, item: HistoryItem) => {
    const current = result.get(key);
    if (!current || item.readAt > current.readAt) result.set(key, item);
  };

  for (const item of historyItems) {
    keepLatest(`${item.sourceId}::${item.mangaId}`, item);
    if (item.savedTitleId) keepLatest(item.savedTitleId, item);
  }

  return result;
}

function latestHistoryFor(
  item: LibraryItem,
  historyByKey: Map<string, HistoryItem>
): HistoryItem | undefined {
  let latest: HistoryItem | undefined;

  for (const key of libraryRefs(item)) {
    const history = historyByKey.get(key);
    if (history && (!latest || history.readAt > latest.readAt)) latest = history;
  }

  return latest;
}

function isSeriesFinished(history?: HistoryItem): boolean {
  if (!history) return false;
  if ((history.seriesProgressPercent ?? 0) >= 100) return true;

  if (
    typeof history.chapterIndex === "number" &&
    typeof history.totalChapters === "number" &&
    history.totalChapters > 0
  ) {
    return history.chapterIndex + 1 >= history.totalChapters;
  }

  return false;
}

function normalized(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function sortByAddedDesc(a: LibraryItem, b: LibraryItem) {
  return timestamp(b.addedAt) - timestamp(a.addedAt);
}

export function deriveSmartCollections(
  libraryItems: LibraryItem[],
  historyItems: HistoryItem[],
  options: SmartCollectionOptions = {}
): SmartCollection[] {
  const now = options.now ?? Date.now();
  const recentCutoff = now - (options.recentDays ?? 14) * DAY_MS;
  const staleCutoff = now - (options.staleDays ?? 30) * DAY_MS;
  const highRatingThreshold = options.highRatingThreshold ?? 8;
  const historyByKey = latestHistoryByKey(historyItems);

  const withHistory = libraryItems.map((item) => ({
    item,
    history: latestHistoryFor(item, historyByKey),
  }));

  const continueReading = withHistory
    .filter(({ history }) => Boolean(history) && !isSeriesFinished(history))
    .sort((a, b) => (b.history?.readAt ?? 0) - (a.history?.readAt ?? 0))
    .map(({ item }) => item);

  const unread = withHistory
    .filter(({ item, history }) => !history && !item.lastReadAt)
    .map(({ item }) => item)
    .sort(sortByAddedDesc);

  const recentlyAdded = libraryItems
    .filter((item) => timestamp(item.addedAt) >= recentCutoff)
    .sort(sortByAddedDesc);

  const highlyRated = libraryItems
    .filter((item) => (item.userRating ?? 0) >= highRatingThreshold)
    .sort((a, b) =>
      (b.userRating ?? 0) - (a.userRating ?? 0) ||
      timestamp(b.updatedAt) - timestamp(a.updatedAt)
    );

  const stale = withHistory
    .filter(({ history }) =>
      Boolean(history) &&
      !isSeriesFinished(history) &&
      (history?.readAt ?? Number.POSITIVE_INFINITY) <= staleCutoff
    )
    .sort((a, b) => (a.history?.readAt ?? 0) - (b.history?.readAt ?? 0))
    .map(({ item }) => item);

  const completedUnfinished = withHistory
    .filter(({ item, history }) =>
      normalized(item.status) === "completed" &&
      Boolean(history) &&
      !isSeriesFinished(history)
    )
    .sort((a, b) => (b.history?.readAt ?? 0) - (a.history?.readAt ?? 0))
    .map(({ item }) => item);

  const byFormat = (format: string) =>
    libraryItems
      .filter((item) => normalized(item.format) === format)
      .sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt));

  return [
    { id: "continue-reading", label: "Lanjut Dibaca", items: continueReading },
    { id: "unread", label: "Belum Dibaca", items: unread },
    { id: "recently-added", label: "Baru Ditambahkan", items: recentlyAdded },
    { id: "highly-rated", label: "Rating Tinggi", items: highlyRated },
    { id: "stale", label: "Lama Tidak Dibuka", items: stale },
    { id: "completed-unfinished", label: "Tamat, Belum Selesai", items: completedUnfinished },
    { id: "format-manga", label: "Manga", items: byFormat("manga") },
    { id: "format-manhwa", label: "Manhwa", items: byFormat("manhwa") },
    { id: "format-manhua", label: "Manhua", items: byFormat("manhua") },
  ];
}
