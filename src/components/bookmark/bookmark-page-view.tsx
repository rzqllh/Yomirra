"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarBlank } from "@phosphor-icons/react";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BookmarkSkeleton } from "@/components/skeletons/bookmark-skeleton";
import { useBookmarkReading } from "@/shared/hooks/use-bookmark-reading";
import { useBookmarkCollection } from "@/shared/hooks/use-bookmark-collection";
import { useLibraryStore } from "@/shared/store/library-store";
import { useUpdateStore } from "@/shared/store/update-store";
import { ReadingTab } from "./reading-tab";
import { CollectionTab } from "./collection-tab";
import { HeaderActions } from "@/components/app/header-actions";

export type BookmarkTab = "reading" | "collection";

export function BookmarkPageView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab") as BookmarkTab | null;

  const validTabs: BookmarkTab[] = ["reading", "collection"];
  const [activeTab, setActiveTab] = React.useState<BookmarkTab>(
    initialTabParam && validTabs.includes(initialTabParam) ? initialTabParam : "reading"
  );

  const reading = useBookmarkReading();
  const collection = useBookmarkCollection();
  const libraryItemCount = useLibraryStore((state) => Object.keys(state.items).length);
  const rawUnread = useUpdateStore((state) => state.getUnreadCount());
  const unreadCount = typeof rawUnread === "function" ? (rawUnread as () => number)() : (Number(rawUnread) || 0);

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
      <YomirraSurface variant="base" className="w-full">
        <PageContainer>
          <BookmarkSkeleton />
        </PageContainer>
      </YomirraSurface>
    );
  }

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer>
        {/* Mobile Utility Actions (hidden on desktop where TopNav is canonical) */}
        <div className="flex md:hidden items-center justify-between w-full">
          <span className="font-bold text-xs uppercase tracking-[0.14em] text-accent">Rak Buku</span>
          <HeaderActions />
        </div>

        <h1 className="sr-only">Rak Buku</h1>

        {/* Unified Navigation & Utility Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <SegmentedControl
            options={[
              { value: "reading", label: "Sedang Dibaca" },
              {
                value: "collection",
                label: `Bookmark${libraryItemCount > 0 ? ` (${libraryItemCount})` : ""}`,
              },
            ]}
            value={activeTab}
            onChange={(val) => handleTabChange(val as BookmarkTab)}
            variant="quick-rail"
            className="w-full sm:w-auto"
            layoutId="bookmark-tab-pill"
          />

          <Link
            href="/updates"
            className="inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-lg bg-surface-muted/50 border border-border-subtle hover:bg-surface-hover hover:border-accent/40 text-xs font-semibold text-text-secondary transition-colors shrink-0"
          >
            <span className="flex items-center gap-2">
              <CalendarBlank size={16} weight="duotone" className="text-text-muted" />
              <span>Jadwal Rilis Mingguan</span>
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-semantic-error text-white font-bold">
                {unreadCount > 99 ? "99+" : unreadCount} baru
              </span>
            )}
          </Link>
        </div>

        <div>
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
        </div>
      </PageContainer>
    </YomirraSurface>
  );
}
