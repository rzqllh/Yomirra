import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "./manga-card-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
import { Fire } from "@phosphor-icons/react/dist/ssr";

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
    <YomirraSurface variant="base" className="w-full min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Populer"
          subtitle="Komik yang sedang populer dari sumber aktif."
          icon={<Fire size={24} weight="duotone" />}
          hideDesktop
        />

        <PopularFeedSkeleton cardCount={8} />
        <PopularFeedSkeleton cardCount={8} />
      </PageContainer>
    </YomirraSurface>
  );
}
