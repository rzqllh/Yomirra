import { Skeleton } from "@/components/ui/skeleton"

export function MangaCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 relative">
      <Skeleton className="aspect-[3/4] w-full rounded-[var(--radius-md)]" />
      <div className="absolute top-2 left-2">
        <Skeleton className="h-4 w-12 rounded-[var(--radius-sm)]" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
