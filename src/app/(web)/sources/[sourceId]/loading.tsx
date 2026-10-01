import { PageHeader } from "@/components/app/header";
import { MangaGridSkeleton } from "@/components/skeletons/manga-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col bg-surface-base">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title="Sumber" showBack />
      </div>

      <div className="mx-auto flex w-full max-w-9xl flex-1 flex-col px-4 pb-6 pt-2">
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
      </div>
    </main>
  );
}
