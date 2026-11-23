"use client";

import * as React from "react";
import { useLibraryStore, type LibraryItem } from "@/shared/store/library-store";
import { canonicalSourceKey, groupVerifiedCatalogEntries } from "@/shared/lib/canonical-identity";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { getSourceMetadata, getSourceDisplayName } from "@/shared/sources/source-registry";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useHistoryStore } from "@/shared/store/history-store";
import {
  deriveSmartCollections,
  type SmartCollectionId,
} from "@/shared/lib/smart-collections";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 24;

export function useBookmarkCollection() {
  const isMounted = useMounted();
  const libraryItemsMap = useLibraryStore((state) => state.items);
  const libraryItems = React.useMemo(() => Object.values(libraryItemsMap), [libraryItemsMap]);
  const explicitNsfwRefs = React.useMemo(() => new Set(
    libraryItems.filter(item => item.isNsfw === true)
      .map(item => canonicalSourceKey(item.sourceId, item.mangaId))
  ), [libraryItems]);
  const historyItemsMap = useHistoryStore((state) => state.items);
  const removeFromLibrary = useLibraryStore((state) => state.removeFromLibrary);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const { status: nsfwStatus, ids: nsfwSourceIds } = useNsfwSourceIds();
  const { isSourceDisabled } = useSourcePreferencesStore();
  const { collections, membershipsByManga, createCollection, renameCollection, deleteCollection } = useCollectionStore();

  const [selectedCollectionId, setSelectedCollectionId] = React.useState<string | null>(null);
  const [selectedSmartCollectionId, setSelectedSmartCollectionId] =
    React.useState<SmartCollectionId | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "title">("updatedAt");
  const [sourceFilter, setSourceFilter] = React.useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [collectionPage, setCollectionPage] = React.useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const visibleCatalogGroups = React.useMemo(() => {
    if (!isMounted) return [];

    // ponytail: one canonical visible item per saved source reference.
    const seen = new Set<string>();
    const result: typeof libraryItems = [];
    for (const item of libraryItems) {
      if (item.isBookmarked === false) continue;
      const key = item.id ?? `${item.sourceId}::${item.mangaId}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }

    // Saved membership must survive an unavailable/disabled primary provider.
    // Only content visibility, never health status, can hide a saved work.
    if (hideNsfw && nsfwStatus !== "KNOWN") return [];
    const eligible = hideNsfw
      ? result.filter((item) => {
          const source = dynamicSourceRegistry.get(item.sourceId) ?? getSourceMetadata(item.sourceId);
          return !isFromNsfwSource(item.sourceId, item.isNsfw) && source?.isNsfw !== true;
        })
      : result;

    // Presentation projection only: keep every original library record and
    // aggregate only source bindings whose identity was explicitly confirmed.
    return groupVerifiedCatalogEntries(eligible);
  }, [
    hideNsfw,
    isFromNsfwSource,
    isMounted,
    libraryItems,
    nsfwStatus,
  ]);

  const visibleLibraryItems = React.useMemo(
    () => visibleCatalogGroups.map(group => group.representative),
    [visibleCatalogGroups],
  );

  const groupForItem = React.useCallback((item: LibraryItem) =>
    visibleCatalogGroups.find(group => group.representative === item),
  [visibleCatalogGroups]);

  const mayExposeSource = React.useCallback((sourceId: string, mangaId?: string) => {
    if (isSourceDisabled(sourceId)) return false;
    if (hideNsfw && mangaId && explicitNsfwRefs.has(canonicalSourceKey(sourceId, mangaId))) return false;
    const source = dynamicSourceRegistry.get(sourceId) ?? getSourceMetadata(sourceId);
    if (source?.status === "unavailable" || source?.status === "in-fix") return false;
    if (hideNsfw && (nsfwStatus !== "KNOWN" || nsfwSourceIds.has(sourceId) || source?.isNsfw)) return false;
    return true;
  }, [isSourceDisabled, hideNsfw, nsfwStatus, nsfwSourceIds, explicitNsfwRefs]);

  const itemMatchesSource = React.useCallback((item: LibraryItem, sourceId: string) => {
    const group = groupForItem(item);
    return group?.sourceBindings.some(ref => ref.sourceId === sourceId && mayExposeSource(ref.sourceId, ref.mangaId))
      ?? item.sourceId === sourceId;
  }, [groupForItem, mayExposeSource]);

  const scopedItems = React.useMemo(() => {
    if (!sourceFilter) return visibleLibraryItems;
    return visibleLibraryItems.filter(item => itemMatchesSource(item, sourceFilter));
  }, [visibleLibraryItems, sourceFilter, itemMatchesSource]);

  const smartCollections = React.useMemo(
    () =>
      deriveSmartCollections(
        scopedItems,
        Object.values(historyItemsMap)
      ),
    [historyItemsMap, scopedItems]
  );

  const handleSmartCollectionChange = React.useCallback(
    (id: SmartCollectionId | null) => {
      setSelectedSmartCollectionId(id);
      if (id !== null) {
        setSelectedCollectionId(null);
      }
    },
    []
  );

  const handleCollectionChange = React.useCallback((id: string | null) => {
    setSelectedCollectionId(id);
    if (id !== null) {
      setSelectedSmartCollectionId(null);
    }
  }, []);

  const clearCollectionFilters = React.useCallback(() => {
    setSelectedCollectionId(null);
    setSelectedSmartCollectionId(null);
    setSourceFilter(null);
  }, []);

  const availableSources = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of visibleCatalogGroups) {
      for (const ref of group.sourceBindings) {
        if (!mayExposeSource(ref.sourceId, ref.mangaId) || map.has(ref.sourceId)) continue;
        const meta = getSourceMetadata(ref.sourceId);
        map.set(ref.sourceId, meta?.name || group.representative.sourceName || getSourceDisplayName(ref.sourceId));
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [visibleCatalogGroups, mayExposeSource]);

  const filteredAndSortedLibraryItems = React.useMemo(() => {
    let result = [...visibleLibraryItems];

    if (sourceFilter) {
      result = result.filter((item) => itemMatchesSource(item, sourceFilter));
    }

    if (selectedSmartCollectionId) {
      const smartCollection = smartCollections.find(
        (collection) => collection.id === selectedSmartCollectionId
      );
      const allowed = new Set(
        (smartCollection?.items ?? []).map(
          (item) => item.id ?? `${item.sourceId}::${item.mangaId}`
        )
      );
      result = result.filter((item) =>
        allowed.has(item.id ?? `${item.sourceId}::${item.mangaId}`)
      );
    }

    if (selectedCollectionId) {
      result = result.filter((item) => {
        const group = groupForItem(item);
        return (group?.members ?? [item]).some(member => {
          const key = member.id ?? `${member.sourceId}::${member.mangaId}`;
          const legacyKey = `${member.sourceId}::${member.mangaId}`;
          const memberships = membershipsByManga[key] || membershipsByManga[legacyKey] || [];
          return memberships.includes(selectedCollectionId);
        });
      });
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) => item.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortBy === "updatedAt") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [
    membershipsByManga,
    searchQuery,
    selectedCollectionId,
    selectedSmartCollectionId,
    smartCollections,
    sortBy,
    sourceFilter,
    visibleLibraryItems,
    itemMatchesSource,
    groupForItem,
  ]);

  // Reset pagination when search, sort, or collection filter changes
  React.useEffect(() => {
    setCollectionPage(1);
  }, [searchQuery, sortBy, selectedCollectionId, selectedSmartCollectionId, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLibraryItems.length / ITEMS_PER_PAGE));
  const paginatedCollection = React.useMemo(() => {
    const start = (collectionPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedLibraryItems.slice(start, start + ITEMS_PER_PAGE).map(item => {
      const group = groupForItem(item);
      // The binding list belongs to display navigation only; this never rewrites
      // saved Library entries or their source-specific history.
      return {
        ...item,
        sourceBindings: (group?.sourceBindings ?? [])
          .filter(ref => mayExposeSource(ref.sourceId, ref.mangaId))
          .map(ref => ({ ...ref, title: item.title })),
      };
    });
  }, [filteredAndSortedLibraryItems, collectionPage, groupForItem, mayExposeSource]);

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
    const sourceRefs = new Map<string, { sourceId: string; mangaId: string }>();
    selectedItems.forEach(key => {
      const group = visibleCatalogGroups.find(candidate =>
        candidate.members.some(member => `${member.sourceId}::${member.mangaId}` === key)
      );
      for (const member of group?.members ?? []) {
        sourceRefs.set(canonicalSourceKey(member.sourceId, member.mangaId), {
          sourceId: member.sourceId, mangaId: member.mangaId,
        });
      }
    });
    for (const ref of sourceRefs.values()) {
      removeFromLibrary(ref.sourceId, ref.mangaId);
    }
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
    sourceFilter,
    setSourceFilter,
    availableSources,
    isSelectionMode,
    setIsSelectionMode,
    selectedItems,
    setSelectedItems,
    collectionPage,
    setCollectionPage,
    totalPages,
    visibleCatalogCount: visibleLibraryItems.length,
    totalLibraryItemsCount: scopedItems.length,
    scopedItems,
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
    setSelectedCollectionId: handleCollectionChange,
    smartCollections,
    selectedSmartCollectionId,
    setSelectedSmartCollectionId: handleSmartCollectionChange,
    clearCollectionFilters,
    createCollection,
    renameCollection,
    deleteCollection,
  };
}
