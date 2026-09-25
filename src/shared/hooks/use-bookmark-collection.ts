"use client";

import * as React from "react";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useCollectionStore } from "@/shared/store/collection-store";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 24;

export function useBookmarkCollection() {
  const isMounted = useMounted();
  const libraryItemsMap = useLibraryStore((state) => state.items);
  const libraryItems = Object.values(libraryItemsMap);
  const removeFromLibrary = useLibraryStore((state) => state.removeFromLibrary);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();
  const { isSourceDisabled } = useSourcePreferencesStore();
  const { collections, membershipsByManga, createCollection, renameCollection, deleteCollection } = useCollectionStore();

  const [selectedCollectionId, setSelectedCollectionId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "title">("updatedAt");
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [collectionPage, setCollectionPage] = React.useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const filteredAndSortedLibraryItems = React.useMemo(() => {
    if (!isMounted) return [];
    // ponytail: deduplicate items by sourceId::mangaId to guarantee unique keys in UI
    const seen = new Set<string>();
    let result: typeof libraryItems = [];
    for (const item of libraryItems) {
      const key = `${item.sourceId}::${item.mangaId}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }

    result = result.filter((item) => {
      if (isSourceDisabled(item.sourceId)) return false;
      const source = dynamicSourceRegistry.get(item.sourceId);
      if (source && source.status === "unavailable") return false;
      return true;
    });

    if (hideNsfw) {
      if (nsfwStatus !== "KNOWN") {
        result = [];
      } else {
        result = result.filter(
          (item) => !isFromNsfwSource(item.sourceId, item.isNsfw)
        );
      }
    }

    if (selectedCollectionId) {
      result = result.filter((item) => {
        const key = item.id ?? `${item.sourceId}::${item.mangaId}`;
        const legacyKey = `${item.sourceId}::${item.mangaId}`;
        const memberships = membershipsByManga[key] || membershipsByManga[legacyKey] || [];
        return memberships.includes(selectedCollectionId);
      });
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortBy === "updatedAt") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [isMounted, libraryItems, selectedCollectionId, membershipsByManga, searchQuery, sortBy, hideNsfw, nsfwStatus, isFromNsfwSource, isSourceDisabled]);

  // Reset pagination when search, sort, or collection filter changes
  React.useEffect(() => {
    setCollectionPage(1);
  }, [searchQuery, sortBy, selectedCollectionId]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLibraryItems.length / ITEMS_PER_PAGE));
  const paginatedCollection = React.useMemo(() => {
    const start = (collectionPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedLibraryItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedLibraryItems, collectionPage]);

  const toggleSelectItem = (key: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedLibraryItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(
        new Set(filteredAndSortedLibraryItems.map((i) => `${i.sourceId}::${i.mangaId}`))
      );
    }
  };

  const handleConfirmBulkDelete = () => {
    const count = selectedItems.size;
    selectedItems.forEach((key) => {
      const [sourceId, mangaId] = key.split("::");
      if (sourceId && mangaId) {
        removeFromLibrary(sourceId, mangaId);
      }
    });
    setSelectedItems(new Set());
    setIsSelectionMode(false);
    setIsDeleteDialogOpen(false);
    toast.success(`${count} manga dihapus dari bookmark`);
  };

  return {
    isMounted,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isSelectionMode,
    setIsSelectionMode,
    selectedItems,
    setSelectedItems,
    collectionPage,
    setCollectionPage,
    totalPages,
    filteredAndSortedLibraryItems,
    paginatedCollection,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    toggleSelectItem,
    handleSelectAll,
    handleConfirmBulkDelete,
    // Custom Collection Rail Integration
    collections,
    membershipsByManga,
    selectedCollectionId,
    setSelectedCollectionId,
    createCollection,
    renameCollection,
    deleteCollection,
  };
}
