import * as React from "react";
import { DestinationHeader } from "@/components/chrome/header";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/komik/manga-card-skeleton";

export function BookmarkSkeleton() {
  return (
    <>
      <DestinationHeader destination="bookmark" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full rounded-xl sm:w-64" />
        <Skeleton className="h-9 w-full rounded-lg sm:w-48" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MangaCardSkeleton key={i} variant="history" />
        ))}
      </div>
    </>
  );
}
