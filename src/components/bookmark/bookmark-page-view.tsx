"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BookBookmark, CalendarBlank, CaretRight } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";
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
      <YomirraSurface variant="base" className="min-h-screen">
        <div className="mx-auto flex w-full max-w-9xl flex-col pb-[calc(var(--bottom-nav-height,80px)+24px)] md:px-8 md:pb-10">
          <BookmarkSkeleton />
        </div>
      </YomirraSurface>
    );
  }

  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <div className="mx-auto flex w-full max-w-9xl flex-col pb-[calc(var(--bottom-nav-height,80px)+24px)] md:px-8 md:pb-10">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-0 md:pt-8">
        <PageHeader
          title="Rak Buku"
          description="Bacaan, koleksi, & pembaruan komik favoritmu"
          icon={<BookBookmark size={24} weight="duotone" />}
          actions={<HeaderActions />}
        />
      </div>

      {/* Notion-Style Jadwal Rilis Mingguan Shortcut Banner */}
      <div className="px-4 pb-3 w-full md:px-0 md:max-w-2xl">
        <Link
          href="/updates"
          className="flex items-center justify-between p-3.5 rounded-xl bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-surface-hover transition-all group shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/20">
              <CalendarBlank size={20} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                  Jadwal Rilis Mingguan
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-semantic-error text-white font-extrabold animate-in fade-in shadow-xs">
                    {unreadCount > 99 ? "99+" : unreadCount} baru
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Pantau jadwal update komik bookmark (Senin – Minggu)
              </p>
            </div>
          </div>
          <CaretRight size={18} weight="bold" className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Rak Buku"
        className="px-4 pt-1 pb-4 w-full md:px-0 md:max-w-xl"
      >
        <SegmentedControl
          options={[
            { value: "reading", label: "Sedang Dibaca" },
            {
              value: "collection",
              label: "Koleksi",
              badge: libraryItemCount > 0 ? libraryItemCount : undefined,
            },
          ]}
          value={activeTab}
          onChange={(val) => handleTabChange(val as BookmarkTab)}
          variant="quick-rail"
          fullWidth
          className="h-[46px]"
          layoutId="bookmark-tab-pill"
        />
      </div>

      <div className="px-4 mt-1 outline-none md:px-0">
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
      </div>
    </YomirraSurface>
  );
}
