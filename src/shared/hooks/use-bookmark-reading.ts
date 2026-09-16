"use client";

import * as React from "react";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useMounted } from "@/shared/hooks/use-mounted";
import { toast } from "sonner";

export function useBookmarkReading() {
  const isMounted = useMounted();
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  useHistoryStore((state) => state.items);
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();
  const { isSourceDisabled } = useSourcePreferencesStore();

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const rawHistoryItems = isMounted ? getHistoryList() : [];

  let historyItems = rawHistoryItems.filter((item) => {
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
        (item) => !isFromNsfwSource(item.sourceId, item.isNsfw)
      );
    }
  }

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
      }
    > = {};

    historyItems.forEach((item) => {
      const key = `${item.sourceId}::${item.mangaId}`;
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
        group.latestReadAt = getTimestamp(group.chapters[0].readAt);
      }
    });

    return Object.values(groups).sort((a, b) => b.latestReadAt - a.latestReadAt);
  }, [historyItems]);

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

    toast.success(`'${title}' dihapus dari riwayat`, {
      action: {
        label: "Batal",
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
          toast.info("Penghapusan dibatalkan");
        },
      },
      duration: 4000,
    });

    deleteTimeouts.current[itemKey] = setTimeout(() => {
      removeMangaHistory(sourceId, mangaId);
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
      delete deleteTimeouts.current[itemKey];
    }, 4000);
  };

  const confirmDeleteHistory = () => {
    if (!itemToDelete) return;
    removeMangaHistory(itemToDelete.sourceId, itemToDelete.mangaId);
    toast.success(`Riwayat '${itemToDelete.mangaTitle}' berhasil dihapus`);
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
