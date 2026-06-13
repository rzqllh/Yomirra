import { Skeleton } from "@/components/ui/skeleton"

export function HistorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex h-16 items-center gap-4">
          <Skeleton className="aspect-[3/4] h-full rounded-sm" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}
