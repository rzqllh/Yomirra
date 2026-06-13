import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";

export function SourceFeedSkeleton() {
  return (
    <div className="space-y-10 pt-4 border-t border-border-subtle/30 first:pt-0 first:border-t-0">
      <section>
        <div className="flex items-center justify-between mb-4 md:mb-6 px-4 md:px-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex overflow-x-hidden gap-3 sm:gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0">
              <MangaCardSkeleton variant="editorial" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 md:mb-6 px-4 md:px-0">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 px-4 md:px-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full">
              <MangaCardSkeleton variant="shelf" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
