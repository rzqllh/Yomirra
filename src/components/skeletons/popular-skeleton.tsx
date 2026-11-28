import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/komik/manga-card-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { DestinationHeader } from "@/components/chrome/header";

export function PopularFeedSkeleton({ cardCount = 8 }: { cardCount?: number }) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-36 sm:w-44 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
    <Surface variant="base" className="w-full min-h-screen">
      <PageContainer hasMobileHeader>
        <DestinationHeader destination="popular" />

        <div role="status" aria-label="Memuat peringkat populer">
          <Skeleton className="mb-4 h-13 w-full rounded-xl sm:max-w-xs" />
          <PopularFeedSkeleton cardCount={8} />
        </div>
      </PageContainer>
    </Surface>
  );
}
