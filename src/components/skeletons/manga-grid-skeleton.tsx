import { MangaCardSkeleton } from "./manga-card-skeleton";
import { MANGA_GRID_CLASS, MANGA_COMPACT_GRID_CLASS } from "@/components/manga/manga-grid";
import { cn } from "@/shared/utils/cn";

export interface MangaGridSkeletonProps {
  count?: number;
  className?: string;
  viewMode?: "grid" | "compact";
}

export function MangaGridSkeleton({
  count = 12,
  className,
  viewMode = "grid",
}: MangaGridSkeletonProps) {
  const gridClass = viewMode === "compact" ? MANGA_COMPACT_GRID_CLASS : MANGA_GRID_CLASS;
  const variant = viewMode === "compact" ? "compact" : "shelf";

  return (
    <div className={cn(gridClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
