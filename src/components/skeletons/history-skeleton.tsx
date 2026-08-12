import { Skeleton } from "@/components/ui/skeleton"

export function HistorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        // Mirrors HistoryCard: rounded-xl p-3, cover h-[84px] w-[60px], play button h-8 w-8 rounded-full
        <div key={i} className="flex items-center gap-4 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/50">
          <Skeleton className="h-[84px] w-[60px] rounded-sm shrink-0" />
          <div className="flex-1 flex flex-col justify-center gap-2">
            {/* Title */}
            <Skeleton className="h-4 w-3/4" />
            {/* Chapter subtitle */}
            <Skeleton className="h-3 w-1/2" />
            {/* Format metadata */}
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          {/* Play button: h-8 w-8 rounded-full */}
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}
