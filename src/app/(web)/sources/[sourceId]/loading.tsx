import { PageHeader } from "@/components/app/header";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-surface-base">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title="Sumber" showBack />
      </div>
      <div className="mx-auto flex w-full max-w-9xl flex-col px-4 pb-6 pt-2">
        <Skeleton className="mb-6 h-20 w-full rounded-xl" />
        <SearchResultSkeleton />
      </div>
    </main>
  );
}
