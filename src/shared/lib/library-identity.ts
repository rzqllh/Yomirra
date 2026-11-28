import { canonicalSourceKey, provenReferences } from "./canonical-identity";
import { getReviewedCatalogIndex, getReviewedCatalogWork } from "./reviewed-catalog";
import type { LibraryItem, LibrarySourceProgress, SourceRef } from "@/shared/store/library-store";

export function librarySourceProgress(item: LibrarySourceProgress): LibrarySourceProgress {
  return {
    lastReadChapterId: item.lastReadChapterId,
    lastReadChapterTitle: item.lastReadChapterTitle,
    lastReadAt: item.lastReadAt,
    highestMilestoneChapterId: item.highestMilestoneChapterId,
    highestMilestoneChapterTitle: item.highestMilestoneChapterTitle,
    highestMilestoneIndex: item.highestMilestoneIndex,
  };
}

export function getLibrarySourceProgress(item: LibraryItem, sourceId: string, mangaId: string): LibrarySourceProgress {
  return sourceId === (item.primarySourceId ?? item.sourceId) && mangaId === (item.primaryMangaId ?? item.mangaId)
    ? librarySourceProgress(item)
    : item.progressBySource?.[canonicalSourceKey(sourceId, mangaId)] ?? {};
}

export function updateLibrarySourceProgress(item: LibraryItem, sourceId: string, mangaId: string, patch: Partial<LibraryItem>) {
  if (sourceId === (item.primarySourceId ?? item.sourceId) && mangaId === (item.primaryMangaId ?? item.mangaId)) return patch;
  const progressFields = Object.keys(librarySourceProgress(item)) as (keyof LibrarySourceProgress)[];
  const progress = Object.fromEntries(progressFields.filter(key => key in patch).map(key => [key, patch[key]]));
  if (!Object.keys(progress).length) return patch;
  const next = { ...patch };
  for (const field of progressFields) delete next[field];
  const key = canonicalSourceKey(sourceId, mangaId);
  const fields = { ...item.progressBySource?.[key], ...progress };
  next.progressBySource = {
    ...item.progressBySource,
    [key]: Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)),
  };
  return next;
}

export function libraryItemKey(item: LibraryItem): string {
  return item.id ?? `${item.sourceId}::${item.mangaId}`;
}

export function libraryMembershipKeys(item: LibraryItem): string[] {
  return [...new Set([
    libraryItemKey(item),
    ...(item.savedTitleAliases ?? []),
    ...provenReferences(item).map(ref => `${ref.sourceId}::${ref.mangaId}`),
  ])];
}

export function withReviewedIdentity(item: LibraryItem): LibraryItem {
  const reviewed = getReviewedCatalogIndex().get(canonicalSourceKey(item.sourceId, item.mangaId));
  if (!reviewed) return item;
  const work = getReviewedCatalogWork(reviewed.slice("global:".length));
  if (!work) return item;
  const links = work.bindings.map(({ sourceId, mangaId }): SourceRef => ({
    sourceId, mangaId, matchConfidence: "CONFIRMED", addedAt: Date.parse(item.addedAt) || 0,
  }));
  return { ...item, canonicalWorkId: reviewed, linkedSources: mergeLinks(item.linkedSources, links) };
}

export function reconcileStoredLibrary(items: Record<string, LibraryItem>): Record<string, LibraryItem> {
  const enriched = Object.fromEntries(Object.entries(items).map(([key, item]) => [key, withReviewedIdentity(item)]));
  const seen = new Set<string>();
  for (const item of Object.values(enriched)) {
    const keys = new Set([
      ...provenReferences(item).map(ref => canonicalSourceKey(ref.sourceId, ref.mangaId)),
      ...[libraryItemKey(item), ...(item.savedTitleAliases ?? [])].map(id => `saved:${id}`),
      ...(item.canonicalWorkId ? [`work:${item.canonicalWorkId}`] : []),
    ]);
    if ([...keys].some(key => seen.has(key))) {
      let reconciled: Record<string, LibraryItem> = {};
      for (const record of Object.values(enriched)) {
        reconciled = reconcileLibraryItem(reconciled, record, "sync").items;
      }
      return reconciled;
    }
    keys.forEach(key => seen.add(key));
  }
  return enriched;
}

const confidenceOrder = { NO_MATCH: 0, AMBIGUOUS: 1, HIGH_CONFIDENCE: 2, CONFIRMED: 3 };

function mergeLinks(...lists: (readonly SourceRef[] | undefined)[]): SourceRef[] {
  const links = new Map<string, SourceRef>();
  for (const list of lists) {
    for (const link of list ?? []) {
      const key = canonicalSourceKey(link.sourceId, link.mangaId);
      const previous = links.get(key);
      if (!previous || confidenceOrder[link.matchConfidence] > confidenceOrder[previous.matchConfidence]) {
        links.set(key, link);
      }
    }
  }
  return [...links.values()];
}

export function sameSavedWork(a: LibraryItem, b: LibraryItem): boolean {
  if (a.id && a.id === b.id) return true;
  if (Boolean(a.isNsfw) !== Boolean(b.isNsfw)) return false;
  if (a.canonicalWorkId && b.canonicalWorkId && a.canonicalWorkId !== b.canonicalWorkId) return false;
  const aId = libraryItemKey(a);
  const bId = libraryItemKey(b);
  if (aId === bId || a.savedTitleAliases?.includes(bId) || b.savedTitleAliases?.includes(aId)) return true;
  const aRefs = provenReferences(a);
  const bRefs = provenReferences(b);
  const sharesRef = aRefs.some(ref => bRefs.some(other => ref.sourceId === other.sourceId && ref.mangaId === other.mangaId));
  if (sharesRef) return true;
  return Boolean(a.canonicalWorkId && a.canonicalWorkId === b.canonicalWorkId &&
    !aRefs.some(ref => bRefs.some(other => ref.sourceId === other.sourceId && ref.mangaId !== other.mangaId)));
}

function mergeSourceProgress(
  previous: LibrarySourceProgress,
  incoming: LibrarySourceProgress,
): LibrarySourceProgress {
  const previousReadAt = Date.parse(previous.lastReadAt ?? "") || 0;
  const incomingReadAt = Date.parse(incoming.lastReadAt ?? "") || 0;
  const takeRead = Boolean(incoming.lastReadChapterId) &&
    (!previous.lastReadChapterId || incomingReadAt >= previousReadAt);
  const takeMilestone = (Boolean(incoming.highestMilestoneChapterId) || incoming.highestMilestoneIndex !== undefined) &&
    ((incoming.highestMilestoneIndex ?? -1) > (previous.highestMilestoneIndex ?? -1) ||
      (incoming.highestMilestoneIndex === previous.highestMilestoneIndex && Boolean(incoming.highestMilestoneChapterId)));
  const sameRead = incoming.lastReadChapterId === previous.lastReadChapterId;
  const sameMilestone = incoming.highestMilestoneChapterId === previous.highestMilestoneChapterId;

  return {
    lastReadChapterId: takeRead ? incoming.lastReadChapterId : previous.lastReadChapterId,
    lastReadChapterTitle: takeRead
      ? incoming.lastReadChapterTitle ?? (sameRead ? previous.lastReadChapterTitle : undefined)
      : previous.lastReadChapterTitle,
    lastReadAt: takeRead ? incoming.lastReadAt : previous.lastReadAt,
    highestMilestoneChapterId: takeMilestone ? incoming.highestMilestoneChapterId : previous.highestMilestoneChapterId,
    highestMilestoneChapterTitle: takeMilestone
      ? incoming.highestMilestoneChapterTitle ?? (sameMilestone ? previous.highestMilestoneChapterTitle : undefined)
      : previous.highestMilestoneChapterTitle,
    highestMilestoneIndex: takeMilestone ? incoming.highestMilestoneIndex : previous.highestMilestoneIndex,
  };
}

export function reconcileLibraryItem(
  items: Record<string, LibraryItem>,
  incoming: LibraryItem,
  mode: "save" | "sync" | "attach",
): { items: Record<string, LibraryItem>; item: LibraryItem } {
  incoming = withReviewedIdentity(incoming);
  const matches = Object.entries(items).filter(([, item]) => sameSavedWork(withReviewedIdentity(item), incoming));
  if (mode === "sync" && !matches.length && !incoming.canonicalWorkId) {
    return { items: { ...items, [libraryItemKey(incoming)]: incoming }, item: incoming };
  }
  matches.sort(([keyA, a], [keyB, b]) => {
    if (a.savedTitleAliases?.includes(libraryItemKey(b))) return -1;
    if (b.savedTitleAliases?.includes(libraryItemKey(a))) return 1;
    return (Date.parse(a.addedAt) || 0) - (Date.parse(b.addedAt) || 0) || keyA.localeCompare(keyB);
  });
  let anchor = mode === "attach" ? incoming : withReviewedIdentity(matches[0]?.[1] ?? incoming);
  // An alias persisted by another device identifies the surviving record.
  if (mode === "sync" && (incoming.savedTitleAliases?.includes(libraryItemKey(anchor)) ||
      (Date.parse(incoming.addedAt) || 0) < (Date.parse(anchor.addedAt) || 0) ||
      (incoming.addedAt === anchor.addedAt && libraryItemKey(incoming) < libraryItemKey(anchor)))) {
    if (!anchor.savedTitleAliases?.includes(libraryItemKey(incoming))) anchor = incoming;
  }
  const key = libraryItemKey(anchor);
  const records = [anchor];
  for (const candidate of [incoming, ...matches.map(([, match]) => match)]) {
    if (records.includes(candidate)) continue;
    if (records.some(record => record.canonicalWorkId && candidate.canonicalWorkId &&
        record.canonicalWorkId !== candidate.canonicalWorkId)) continue;
    records.push(candidate);
  }
  const newest = mode === "sync"
    ? [...records].sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0))[0]
    : incoming;
  const active = mode === "sync" && libraryItemKey(newest) === key ? { ...anchor, ...newest } : anchor;
  const hasOtherBookmark = records.some(record => libraryItemKey(record) !== key &&
    !anchor.savedTitleAliases?.includes(libraryItemKey(record)) && record.isBookmarked !== false);
  const refs = records.flatMap(record => provenReferences(record).map(ref => ({
    ...ref, addedAt: Date.parse(record.addedAt) || 0, matchConfidence: "CONFIRMED" as const,
  })));
  const aliases = [...new Set(records.flatMap(record => [
    ...(mode === "save" && record === incoming ? [] : [libraryItemKey(record)]),
    ...(record.savedTitleAliases ?? []),
  ]))]
    .filter(alias => alias !== key).sort();
  const linkedSources = mergeLinks(...records.map(record => record.linkedSources), refs)
    .filter(ref => ref.sourceId !== (active.primarySourceId ?? active.sourceId) ||
      ref.mangaId !== (active.primaryMangaId ?? active.mangaId))
    .sort((a, b) => canonicalSourceKey(a.sourceId, a.mangaId).localeCompare(canonicalSourceKey(b.sourceId, b.mangaId)));
  const item: LibraryItem = {
    ...active,
    id: key,
    schemaVersion: 2,
    primarySourceId: active.primarySourceId ?? active.sourceId,
    primaryMangaId: active.primaryMangaId ?? active.mangaId,
    canonicalWorkId: records.find(record => record.canonicalWorkId)?.canonicalWorkId,
    ...(aliases.length ? { savedTitleAliases: aliases } : {}),
    linkedSources,
    userRating: active.userRating ?? records.find(record => record.userRating !== undefined)?.userRating,
    updatedAt: mode === "sync" ? active.updatedAt : newest.updatedAt,
    isBookmarked: mode === "save" || hasOtherBookmark ? true : active.isBookmarked,
  };
  const primarySourceKey = canonicalSourceKey(item.primarySourceId ?? item.sourceId, item.primaryMangaId ?? item.mangaId);
  const progressBySource: NonNullable<LibraryItem["progressBySource"]> = {};
  const mergeProgressFor = (sourceKey: string, progress: LibrarySourceProgress) => {
    progressBySource[sourceKey] = mergeSourceProgress(progressBySource[sourceKey] ?? {}, progress);
  };
  for (const record of [...records].sort((a, b) => (Date.parse(a.updatedAt) || 0) - (Date.parse(b.updatedAt) || 0))) {
    for (const [sourceKey, progress] of Object.entries(record.progressBySource ?? {})) {
      mergeProgressFor(sourceKey, progress);
    }
    const recordKey = canonicalSourceKey(record.primarySourceId ?? record.sourceId, record.primaryMangaId ?? record.mangaId);
    const progress = librarySourceProgress(record);
    if (Object.values(progress).some(value => value !== undefined)) mergeProgressFor(recordKey, progress);
  }
  const activeProgress = progressBySource[primarySourceKey];
  if (activeProgress) Object.assign(item, activeProgress);
  delete progressBySource[primarySourceKey];
  if (Object.keys(progressBySource).length) {
    // Sync strips undefined top-level fields. Nested progress must also be serializable.
    item.progressBySource = Object.fromEntries(Object.entries(progressBySource).map(([sourceKey, progress]) => [
      sourceKey,
      Object.fromEntries(Object.entries(progress).filter(([, value]) => value !== undefined)),
    ]));
  } else delete item.progressBySource;
  const next = { ...items };
  for (const [oldKey, oldItem] of matches) {
    if (records.includes(oldItem)) delete next[oldKey];
  }
  next[key] = item;
  return { items: next, item };
}
