import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";

export function SourceFeedSkeleton() {
  return (
    <div className="space-y-10 pt-2 pb-8">
      {/* Lanjut Baca */}
      <section>
        <div className="flex items-center mb-4 px-4 md:px-0">
          <Skeleton className="h-7 w-40 rounded-lg" />
        </div>
        <div className="flex overflow-hidden gap-3 px-4 md:px-0 -mx-4 pb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-[300px] sm:w-[340px] shrink-0">
              <MangaCardSkeleton variant="history" />
            </div>
          ))}
        </div>
      </section>

      {/* Sorotan & Peringkat */}
      <section>
        <div className="flex items-center mb-4 px-4 md:px-0">
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="px-4 md:px-0 mb-4">
           <Skeleton className="w-full h-[400px] sm:h-[460px] md:h-[500px] rounded-[24px]" />
        </div>
        <div className="px-4 md:px-0 space-y-3 mt-4">
          {[...Array(3)].map((_, i) => (
             <MangaCardSkeleton key={i} variant="leaderboard" />
          ))}
        </div>
      </section>

      {/* Populer */}
      <section>
        <div className="flex items-center justify-between mb-4 px-4 md:px-0">
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 px-4 md:px-0">
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
