import { BookmarkSkeleton } from "@/components/skeletons/bookmark-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <BookmarkSkeleton />
      </PageContainer>
    </YomirraSurface>
  );
}
