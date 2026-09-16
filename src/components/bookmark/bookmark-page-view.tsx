"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BookBookmark } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
import { useBookmarkReading } from "@/shared/hooks/use-bookmark-reading";
import { useBookmarkCollection } from "@/shared/hooks/use-bookmark-collection";
import { useLibraryStore } from "@/shared/store/library-store";
import { ReadingTab } from "./reading-tab";
import { CollectionTab } from "./collection-tab";
import { UpdatesList } from "@/components/updates/updates-list";

export type BookmarkTab = "reading" | "collection" | "updates";

export function BookmarkPageView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab") as BookmarkTab | null;

  const validTabs: BookmarkTab[] = ["reading", "collection", "updates"];
  const [activeTab, setActiveTab] = React.useState<BookmarkTab>(
    initialTabParam && validTabs.includes(initialTabParam) ? initialTabParam : "reading"
  );

  const reading = useBookmarkReading();
  const collection = useBookmarkCollection();
  const libraryItemCount = useLibraryStore((state) => Object.keys(state.items).length);

  const handleTabChange = (tab: BookmarkTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "reading") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  if (!reading.isMounted || !collection.isMounted) {
    return (
      <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)]">
        <h1 className="sr-only">Rak Buku Yomirra</h1>
        <div className="px-4 pt-[calc(var(--safe-top)+16px)] pb-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-44 rounded-md" />
          </div>
        </div>
        <div className="px-4 pt-1 pb-4">
          <Skeleton className="h-[46px] w-full rounded-full" />
        </div>
        <div className="px-4 mt-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MangaCardSkeleton key={i} variant="history" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)]">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader
          title="Rak Buku"
          description="Bacaan, koleksi, & pembaruan komik favoritmu"
          icon={<BookBookmark size={24} weight="duotone" />}
          meta={
            libraryItemCount > 0 ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                {libraryItemCount} judul
              </span>
            ) : undefined
          }
        />
      </div>

      <div
        role="tablist"
        aria-label="Rak Buku"
        className="px-4 pt-1 pb-4 w-full"
      >
        <SegmentedControl
          options={[
            { value: "reading", label: "Sedang Dibaca" },
            { value: "collection", label: "Koleksi" },
            { value: "updates", label: "Updates" },
          ]}
          value={activeTab}
          onChange={(val) => handleTabChange(val as BookmarkTab)}
          variant="glass-floating"
          fullWidth
          className="h-[46px]"
          layoutId="bookmark-tab-pill"
        />
      </div>

      <div className="px-4 mt-1 outline-none">
        {activeTab === "reading" && (
          <ReadingTab
            groupedHistory={reading.groupedHistory}
            pendingDeletions={reading.pendingDeletions}
            onRemoveHistory={reading.handleRemoveHistory}
          />
        )}

        {activeTab === "collection" && (
          <CollectionTab
            searchQuery={collection.searchQuery}
            onSearchChange={(e) => collection.setSearchQuery(e.target.value)}
            onSearchClear={() => collection.setSearchQuery("")}
            sortBy={collection.sortBy}
            onSortChange={collection.setSortBy}
            isSelectionMode={collection.isSelectionMode}
            onToggleSelectionMode={() => {
              collection.setIsSelectionMode(!collection.isSelectionMode);
              collection.setSelectedItems(new Set());
            }}
            selectedItems={collection.selectedItems}
            onToggleSelectItem={collection.toggleSelectItem}
            onSelectAll={collection.handleSelectAll}
            isDeleteDialogOpen={collection.isDeleteDialogOpen}
            onOpenDeleteDialogChange={collection.setIsDeleteDialogOpen}
            onConfirmBulkDelete={collection.handleConfirmBulkDelete}
            totalItemsCount={collection.filteredAndSortedLibraryItems.length}
            filteredCount={collection.filteredAndSortedLibraryItems.length}
            paginatedCollection={collection.paginatedCollection}
            collectionPage={collection.collectionPage}
            setCollectionPage={collection.setCollectionPage}
            totalPages={collection.totalPages}
            collections={collection.collections}
            membershipsByManga={collection.membershipsByManga}
            selectedCollectionId={collection.selectedCollectionId}
            onSelectCollectionId={collection.setSelectedCollectionId}
            onCreateCollection={collection.createCollection}
            onRenameCollection={collection.renameCollection}
            onDeleteCollection={collection.deleteCollection}
          />
        )}

        {activeTab === "updates" && (
          <UpdatesList />
        )}
      </div>
    </div>
  );
}
