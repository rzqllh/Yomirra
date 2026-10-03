import { PageHeader } from "@/components/app/header";
import { MangaGridSkeleton } from "@/components/skeletons/manga-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader title="Sumber" subtitle="Memuat katalog…" showBack hideDesktop />
        <div className="mb-6 flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-64 max-w-[55vw] rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 w-11 shrink-0 rounded-xl" />
        </div>

        <MangaGridSkeleton
          count={12}
          className="gap-y-6 sm:gap-y-8 md:gap-y-10"
        />
      </PageContainer>
    </YomirraSurface>
  );
}
