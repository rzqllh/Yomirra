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
  const nsfwSourceIds = useNsfwSourceIds();
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
    historyItems = historyItems.filter(
      (item) => !isFromNsfwSource(item.sourceId, item.isNsfw)
    );
  }

  const groupedHistory = React.useMemo(() => {
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
      if (!groups[key]) {
        groups[key] = {
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: item.mangaTitle,
          coverUrl: item.coverUrl,
          sourceName: item.sourceName,
          latestReadAt: item.readAt,
          chapters: [],
        };
      }
      groups[key].chapters.push(item);
      if (item.readAt > groups[key].latestReadAt) {
        groups[key].latestReadAt = item.readAt;
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
