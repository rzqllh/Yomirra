import { PageHeader } from "@/components/app/header";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Cari"
          subtitle="Cari judul dari semua sumber."
          hideDesktop
        />
        <SearchResultSkeleton />
      </PageContainer>
    </YomirraSurface>
  );
}
