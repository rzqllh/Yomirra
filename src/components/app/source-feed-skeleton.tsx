import { HomeHero } from "@/components/app/home-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";

function SpotlightSkeleton() {
  return (
    <div className="ink-panel relative h-[268px] overflow-hidden sm:h-[310px] lg:h-[340px]">
      <div className="absolute inset-0 grid grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)]">
        <div className="flex items-center justify-center p-2 sm:p-3 lg:p-4">
          <Skeleton className="aspect-[2/3] w-full max-w-[104px] rounded-[10px] sm:max-w-[126px] lg:max-w-[176px]" />
        </div>
        <div className="flex min-w-0 flex-col justify-between gap-3 p-3.5 sm:p-5 lg:p-6">
          <div>
            <Skeleton className="mb-2 h-3 w-28 rounded-xs" />
            <Skeleton className="h-6 w-4/5 rounded-xs sm:h-7" />
            <Skeleton className="mt-2 h-3 w-full rounded-xs" />
            <Skeleton className="mt-1.5 h-3 w-5/6 rounded-xs" />
            <Skeleton className="mt-3 h-3 w-2/3 rounded-xs" />
          </div>
          <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2.5">
            <Skeleton className="h-11 w-28 rounded-[10px]" />
            <div className="flex gap-1.5">
              <Skeleton className="size-11 rounded-[10px]" />
              <Skeleton className="size-11 rounded-[10px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="ink-panel flex min-h-[300px] flex-col p-4 sm:p-5 lg:h-[340px] lg:p-4">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border-subtle/60 pb-2.5">
        <Skeleton className="h-4 w-36 rounded-xs" />
        <Skeleton className="h-11 w-28 rounded-[10px]" />
      </div>
      <div className="flex flex-1 flex-col divide-y divide-border-subtle/50">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={
              index === 0
                ? "flex min-h-[72px] flex-1 items-center gap-3 px-1 py-1"
                : "flex min-h-[44px] flex-1 items-center gap-3 px-1 py-0.5"
            }
          >
            <Skeleton
              className={
                index === 0
                  ? "h-8 w-8 shrink-0 rounded-xs"
                  : "h-6 w-8 shrink-0 rounded-xs"
              }
            />
            <Skeleton
              className={
                index === 0
                  ? "h-[72px] w-12 shrink-0 rounded-xs"
                  : "h-[45px] w-[30px] shrink-0 rounded-xs"
              }
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-4/5 rounded-xs" />
              <Skeleton className="h-3 w-2/5 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceFeedSkeleton() {
  return (
    <div className="pb-16" aria-label="Memuat Beranda">
      <div data-home-loading-section="hero">
        <HomeHero candidates={[]} />
      </div>

      <section
        data-home-loading-section="spotlight-ranking"
        className="mt-8 flex min-w-0 flex-col gap-3.5 sm:gap-4"
      >
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <Skeleton className="h-5 w-44 rounded-xs" />
        </div>
        <div className="grid min-w-0 items-stretch gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.38fr)_minmax(290px,0.82fr)]">
          <SpotlightSkeleton />
          <RankingSkeleton />
        </div>
      </section>

      <section
        data-home-loading-section="continue-reading"
        className="mt-11 sm:mt-12"
      >
        <div className="mb-3.5 flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
          <Skeleton className="h-5 w-28 rounded-xs" />
        </div>
        <div className="flex w-full gap-3.5 overflow-hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-[84vw] max-w-[320px] shrink-0 sm:w-auto sm:max-w-none"
            >
              <MangaCardSkeleton variant="history" />
            </div>
          ))}
        </div>
      </section>

      <section
        data-home-loading-section="recently-updated"
        className="mt-10 sm:mt-11"
      >
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            <Skeleton className="h-5 w-36 rounded-xs" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-11 w-20 rounded-[10px]" />
            <Skeleton className="h-11 w-20 rounded-[10px]" />
          </div>
        </div>

        <div className="flex w-full gap-3 overflow-hidden sm:gap-4 md:grid md:grid-cols-3 md:gap-x-4 md:gap-y-6 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="w-[140px] shrink-0 sm:w-[155px] md:w-auto md:min-w-0"
            >
              <MangaCardSkeleton variant="shelf" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
