import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="w-full min-h-screen">
      <PageContainer>
        <div className="flex items-center justify-between w-full md:hidden mb-4">
          <span className="font-bold text-xs uppercase tracking-[0.14em] text-accent">Pencarian</span>
        </div>
        <SearchResultSkeleton />
      </PageContainer>
    </YomirraSurface>
  );
}
