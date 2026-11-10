import { PageHeader } from "@/components/chrome/header";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";

export default function Loading() {
  return (
    <Surface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Cari"
          subtitle="Temukan komik dari berbagai sumber."
          hideDesktop={true}
        />
        <SearchResultSkeleton />
      </PageContainer>
    </Surface>
  );
}
