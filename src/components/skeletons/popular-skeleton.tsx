import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "./manga-card-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export function PopularFeedSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-36 sm:w-44 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="w-full">
            <MangaCardSkeleton variant="editorial" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function PopularPageSkeleton() {
  return (
    <YomirraSurface variant="base" className="w-full min-h-screen">
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48 rounded-md" />
        </div>

        <PopularFeedSkeleton cardCount={6} />
        <PopularFeedSkeleton cardCount={6} />
      </PageContainer>
    </YomirraSurface>
  );
}
