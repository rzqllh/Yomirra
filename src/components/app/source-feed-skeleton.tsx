import { Skeleton } from "@/components/ui/skeleton";

export function SourceFeedSkeleton() {
  return (
    <div className="space-y-10 pt-4 border-t border-border-subtle/30 first:pt-0 first:border-t-0">
      <section>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex overflow-x-hidden gap-3 sm:gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] shrink-0">
              <div className="aspect-[2/3] w-full rounded-[var(--radius-md)] bg-surface-raised mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full">
              <div className="aspect-[2/3] w-full rounded-[var(--radius-md)] bg-surface-raised mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
