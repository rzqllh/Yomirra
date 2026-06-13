import { MangaCardSkeleton } from "./manga-card-skeleton"
import { cn } from "@/shared/utils/cn"

export function MangaGridSkeleton({ count = 12, className }: { count?: number, className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={i} variant="shelf" />
      ))}
    </div>
  )
}
