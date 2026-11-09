import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function Loading() {
  return (
    <Surface variant="base" className="w-full min-h-screen">
      <PageContainer hasMobileHeader>
        <LibrarySkeleton />
      </PageContainer>
    </Surface>
  );
}
