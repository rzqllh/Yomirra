"use client";

import * as React from "react";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { canonicalSourceKey, groupVerifiedCatalogEntries, indexVerifiedGroups, canonicalGroupPreferenceKey, canonicalGroupPreferenceAliases } from "@/shared/lib/canonical-identity";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaKey } from "@/shared/types/collection";
import { toast } from "sonner";

export function useBookmarkReading() {
  const isMounted = useMounted();
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  useHistoryStore((state) => state.items);
  const savedLibraryItems = useLibraryStore((state) => state.items);
  const explicitNsfwRefs = new Set(
    Object.values(savedLibraryItems).filter(item => item.isNsfw === true)
      .map(item => canonicalSourceKey(item.sourceId, item.mangaId))
  );
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();
  const { isSourceDisabled } = useSourcePreferencesStore();
  const readingStatusByManga = useCollectionStore((state) => state.readingStatusByManga);

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const rawHistoryItems = isMounted ? getHistoryList() : [];

  let historyItems = rawHistoryItems.filter((item) => {
    const mangaKey = `${item.sourceId}::${item.mangaId}` as MangaKey;
    if (readingStatusByManga[mangaKey] === "completed") return false;
    if (isSourceDisabled(item.sourceId)) return false;
    const source = dynamicSourceRegistry.get(item.sourceId);
    if (source && source.status === "unavailable") return false;
    return true;
  });

  if (hideNsfw) {
    if (nsfwStatus !== "KNOWN") {
      historyItems = [];
    } else {
      historyItems = historyItems.filter(
        (item) => !isFromNsfwSource(item.sourceId, item.isNsfw) &&
          !explicitNsfwRefs.has(canonicalSourceKey(item.sourceId, item.mangaId))
      );
    }
  }

  const verifiedGroups = React.useMemo(() => {
    // Original source-specific cursor rows remain unmodified.
    return groupVerifiedCatalogEntries(Object.values(savedLibraryItems)
      .filter(item => item.isBookmarked !== false));
  }, [savedLibraryItems]);
  const verifiedIndex = React.useMemo(() => indexVerifiedGroups(verifiedGroups), [verifiedGroups]);
  const preferenceAliasesByGroup = React.useMemo(() =>
    new Map(verifiedGroups.map(group => [
      group.displayKey, canonicalGroupPreferenceAliases(group),
    ])),
  [verifiedGroups]);

  const groupedHistory = React.useMemo(() => {
    const getTimestamp = (val: unknown): number => {
      if (typeof val === "number" && !isNaN(val)) return val;
      if (typeof val === "string") {
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? 0 : parsed;
      }
      if (val && typeof val === "object" && "seconds" in (val as any)) {
        return (val as { seconds: number }).seconds * 1000;
      }
      return 0;
    };

    const groups: Record<
      string,
      {
        sourceId: string;
        mangaId: string;
        mangaTitle: string;
        coverUrl?: string;
        sourceName?: string;
        latestReadAt: number;
        chapters: typeof historyItems;
        preferenceKey?: string;
        preferenceAliases?: string[];
      }
    > = {};

    historyItems.forEach((item) => {
      const canonicalKey = verifiedIndex.get(canonicalSourceKey(item.sourceId, item.mangaId));
      const key = canonicalKey ?? canonicalSourceKey(item.sourceId, item.mangaId);
      const itemTimestamp = getTimestamp(item.readAt);
      const normalizedItem = { ...item, readAt: itemTimestamp };

      if (!groups[key]) {
        groups[key] = {
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: item.mangaTitle,
          coverUrl: item.coverUrl,
          sourceName: item.sourceName,
          latestReadAt: itemTimestamp,
          chapters: [],
          preferenceKey: canonicalKey
            ? preferenceAliasesByGroup.get(canonicalKey)?.[0]
            : `${item.sourceId}::${item.mangaId}`,
          preferenceAliases: canonicalKey
            ? preferenceAliasesByGroup.get(canonicalKey)
            : [`${item.sourceId}::${item.mangaId}`],
        };
      }
      groups[key].chapters.push(normalizedItem);
      if (itemTimestamp > groups[key].latestReadAt) {
        groups[key].latestReadAt = itemTimestamp;
      }
    });

    // Ensure each group's chapters are sorted descending so chapters[0] is always the latest chapter read
    Object.values(groups).forEach((group) => {
      group.chapters.sort((a, b) => getTimestamp(b.readAt) - getTimestamp(a.readAt));
      if (group.chapters.length > 0) {
        const latest = group.chapters[0];
        group.latestReadAt = getTimestamp(latest.readAt);
        group.sourceId = latest.sourceId;
        group.mangaId = latest.mangaId;
        group.sourceName = latest.sourceName ?? group.sourceName;
        group.mangaTitle = latest.mangaTitle || group.mangaTitle;
        group.coverUrl = latest.coverUrl || group.coverUrl;
      }
    });

    return Object.values(groups).sort((a, b) => b.latestReadAt - a.latestReadAt);
  }, [historyItems, verifiedIndex, preferenceAliasesByGroup]);

  // Undo / delete state
  const [pendingDeletions, setPendingDeletions] = React.useState<Set<string>>(new Set());
  const deleteTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});
  const [itemToDelete, setItemToDelete] = React.useState<{
    sourceId: string;
    mangaId: string;
    mangaTitle: string;
  } | null>(null);

  const handleRemoveHistory = (sourceId: string, mangaId: string, title: string) => {
    const itemKey = `${sourceId}::${mangaId}`;
    setPendingDeletions((prev) => new Set(prev).add(itemKey));

    toast.info("Riwayat Dihapus", {
      description: `'${title}' dikeluarkan dari riwayat bacaan.`,
      action: {
        label: "Urungkan",
        onClick: () => {
          if (deleteTimeouts.current[itemKey]) {
            clearTimeout(deleteTimeouts.current[itemKey]);
            delete deleteTimeouts.current[itemKey];
          }
          setPendingDeletions((prev) => {
            const next = new Set(prev);
            next.delete(itemKey);
            return next;
          });
          toast.info("Penghapusan Dibatalkan", {
            description: `'${title}' dikembalikan ke riwayat bacamu.`,
          });
        },
      },
      duration: 4500,
    });

    // A grouped History card represents all verified source sessions of a work.
    // Delete those session records only; bookmarks and downloads are untouched.
    const group = groupedHistory.find(g => g.sourceId === sourceId && g.mangaId === mangaId);
    const sourceRefs = group
      ? [...new Map(group.chapters.map(chapter => [
          canonicalSourceKey(chapter.sourceId, chapter.mangaId),
          { sourceId: chapter.sourceId, mangaId: chapter.mangaId },
        ])).values()]
      : [{ sourceId, mangaId }];
    deleteTimeouts.current[itemKey] = setTimeout(() => {
      for (const ref of sourceRefs) removeMangaHistory(ref.sourceId, ref.mangaId);
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
      delete deleteTimeouts.current[itemKey];
    }, 4500);
  };

  const confirmDeleteHistory = () => {
    if (!itemToDelete) return;
    removeMangaHistory(itemToDelete.sourceId, itemToDelete.mangaId);
    toast.info("Riwayat Dihapus", {
      description: `Riwayat '${itemToDelete.mangaTitle}' berhasil dibersihkan.`,
    });
    setItemToDelete(null);
  };

  return {
    isMounted,
    groupedHistory,
    pendingDeletions,
    itemToDelete,
    setItemToDelete,
    handleRemoveHistory,
    confirmDeleteHistory,
  };
}
