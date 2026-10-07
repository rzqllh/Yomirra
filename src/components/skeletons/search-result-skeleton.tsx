"use client";

import { MangaGridSkeleton } from "@/components/komik/manga-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsStore } from "@/shared/store/settings-store";

export function SearchResultSkeleton({ viewMode }: { viewMode?: "grid" | "compact" }) {
  const storeMode = useSettingsStore((state) => state.listingViewMode);
  const activeMode = viewMode ?? storeMode;

  return (
    <div className="space-y-4 w-full">
      {/* Search Toolbar Placeholder */}
      <div className="flex items-center gap-2 w-full">
        <Skeleton className="flex-1 h-[44px] rounded-xl" />
        <Skeleton className="size-11 rounded-xl shrink-0" />
        <Skeleton className="h-[44px] w-20 rounded-xl shrink-0 hidden sm:block" />
      </div>

      {/* Source Rail Placeholder */}
      <div className="flex items-center gap-2 overflow-hidden py-1">
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-28 rounded-full shrink-0" />
      </div>

      {/* Status / Count */}
      <div className="pt-2">
        <Skeleton className="h-5 w-32 rounded-md" />
      </div>

      {/* Cards Grid */}
      <MangaGridSkeleton count={8} viewMode={activeMode} />
    </div>
  );
}
