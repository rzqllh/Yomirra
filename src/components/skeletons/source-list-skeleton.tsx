import { Skeleton } from "@/components/ui/skeleton"

export function SourceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex h-14 items-center gap-4 rounded-md border border-border-subtle bg-surface-raised p-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
