"use client";

import { MangaGridSkeleton } from "./manga-grid-skeleton";
import { useSettingsStore } from "@/shared/store/settings-store";

export function SearchResultSkeleton({ viewMode }: { viewMode?: "grid" | "compact" }) {
  const storeMode = useSettingsStore((state) => state.listingViewMode);
  const activeMode = viewMode ?? storeMode;

  return (
    <div className="space-y-4 w-full">
      <div className="h-6 w-32 rounded bg-surface-raised motion-safe:animate-pulse" />
      <MangaGridSkeleton count={8} viewMode={activeMode} />
    </div>
  );
}
