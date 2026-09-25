import * as React from "react";
import { BookBookmark } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";

export function BookmarkSkeleton() {
  return (
    <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)] text-text-primary">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader
          title="Rak Buku"
          description="Bacaan, koleksi, & pembaruan komik favoritmu"
          icon={<BookBookmark size={24} weight="duotone" />}
        />
      </div>

      {/* Notion-Style Jadwal Rilis Mingguan Shortcut Banner Placeholder */}
      <div className="px-4 pb-3 w-full">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-raised border border-border-subtle shadow-xs">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* SegmentedControl placeholder */}
      <div className="px-4 pt-1 pb-4 w-full">
        <Skeleton className="h-[46px] w-full rounded-xl" />
      </div>

      {/* Cards placeholder */}
      <div className="px-4 mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MangaCardSkeleton key={i} variant="history" />
        ))}
      </div>
    </div>
  );
}
