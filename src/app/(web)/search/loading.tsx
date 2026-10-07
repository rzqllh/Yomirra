import { PageHeader } from "@/components/chrome/header";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Cari"
          subtitle="Temukan komik dari berbagai sumber."
          hideDesktop
        />
        <SearchResultSkeleton />
      </PageContainer>
    </YomirraSurface>
  );
}
