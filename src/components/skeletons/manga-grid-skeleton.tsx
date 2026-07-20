import { MangaCardSkeleton } from "./manga-card-skeleton"
import { cn } from "@/shared/utils/cn"

export function MangaGridSkeleton({ count = 12, className }: { count?: number, className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10 lg:grid-cols-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={i} variant="shelf" />
      ))}
    </div>
  )
}
