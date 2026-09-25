import * as React from "react";
import { MangaGridSkeleton } from "./manga-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/header";
import { Books } from "@phosphor-icons/react/dist/ssr";

export function LibrarySkeleton() {
  return (
    <div className="w-full flex flex-col">
      <PageHeader
        title="Library"
        description="Katalog judul dari sumber aktif yang dipilih."
        icon={<Books size={24} weight="duotone" />}
      />

      {/* Mobile active source row placeholder */}
      <div className="flex items-center mb-3 md:hidden">
        <Skeleton className="h-[30px] w-44 rounded-xl" />
      </div>

      {/* LibraryToolbar placeholder */}
      <div className="flex items-center gap-2.5 mt-6 md:mt-7">
        <Skeleton className="flex-1 min-w-0 h-[44px] rounded-xl" />
        <Skeleton className="shrink-0 h-[44px] w-24 rounded-xl" />
      </div>

      {/* LibraryStatusRail placeholder */}
      <div className="flex items-center mt-1 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="shrink-0 flex items-center">
          <Skeleton className="h-[36px] w-28 rounded-lg" />
          <div className="w-px h-5 bg-border-subtle shrink-0 mx-2.5" />
        </div>
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 py-3">
          <Skeleton className="h-[36px] w-28 rounded-lg shrink-0" />
          <Skeleton className="h-[36px] w-20 rounded-lg shrink-0" />
          <Skeleton className="h-[36px] w-20 rounded-lg shrink-0" />
          <Skeleton className="h-[36px] w-20 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4">
        <MangaGridSkeleton count={12} className="w-full" />
      </div>
    </div>
  );
}
