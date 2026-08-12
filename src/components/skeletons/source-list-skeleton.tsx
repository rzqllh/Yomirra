import { Skeleton } from "@/components/ui/skeleton"

export function SourceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        // Mirrors SourceCard: rounded-lg border flex-col, inner p-4 header row
        <div key={i} className="rounded-lg border border-border-subtle bg-surface-raised overflow-hidden">
          {/* Header row: icon size-12 rounded-xl, name + lang/version subtitle, badges + toggle */}
          <div className="flex items-center gap-4 p-4 pb-3">
            <Skeleton className="size-12 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            {/* Status badge + toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
          {/* Capabilities badges row */}
          <div className="px-4 pb-3 flex gap-1.5">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
