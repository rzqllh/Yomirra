import * as React from "react";
import { PageHeader } from "@/components/chrome/header";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/komik/manga-card-skeleton";

export function BookmarkSkeleton() {
  return (
    <>
      <PageHeader
        title="Rak Buku"
        subtitle="Lanjutkan bacaan atau kelola bookmark."
        hideDesktop
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-[42px] w-full rounded-xl sm:w-[260px]" />
        <Skeleton className="h-[38px] w-full rounded-lg sm:w-[190px]" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MangaCardSkeleton key={i} variant="history" />
        ))}
      </div>
    </>
  );
}
