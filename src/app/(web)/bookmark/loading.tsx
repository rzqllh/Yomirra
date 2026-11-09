import { BookmarkSkeleton } from "@/components/skeletons/bookmark-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function Loading() {
  return (
    <Surface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <BookmarkSkeleton />
      </PageContainer>
    </Surface>
  );
}
