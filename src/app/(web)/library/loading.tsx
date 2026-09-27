import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="w-full min-h-screen">
      <PageContainer>
        <LibrarySkeleton />
      </PageContainer>
    </YomirraSurface>
  );
}
