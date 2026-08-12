import { MangaCardSkeleton } from "./manga-card-skeleton"
import { MANGA_GRID_CLASS } from "@/components/manga/manga-grid"
import { cn } from "@/shared/utils/cn"

export function MangaGridSkeleton({ count = 12, className }: { count?: number, className?: string }) {
  return (
    <div className={cn(MANGA_GRID_CLASS, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={i} variant="shelf" />
      ))}
    </div>
  )
}
