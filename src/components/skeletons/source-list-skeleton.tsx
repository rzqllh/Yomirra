import { Skeleton } from "@/components/ui/skeleton";

export function SourceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-raised shadow-xs"
        >
          <div className="flex items-start gap-3.5 p-4 pb-3">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-2/5 rounded-md" />
                <Skeleton className="h-5 w-16 shrink-0 rounded-lg" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-base/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Skeleton className="h-5 w-9 shrink-0 rounded-xl" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-7 w-24 shrink-0 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
