import { Skeleton } from "@/components/ui/skeleton"

export function ChapterListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col w-full">
      {Array.from({ length: count }).map((_, i) => (
        // Mirrors ChapterRow: py-3 border-b, flex items-center gap-3
        // title text-[13px] + date text-[10px] on left, download button on right (pl-3 border-l)
        <div
          key={i}
          className="flex items-center gap-3 py-3 border-b border-border-default/40 last:border-b-0"
        >
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          {/* Download button area: pl-3 border-l */}
          <div className="pl-3 border-l border-border-default/50 shrink-0">
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}
