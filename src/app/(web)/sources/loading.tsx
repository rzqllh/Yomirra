import { DestinationHeader } from "@/components/chrome/header";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Surface variant="base" className="min-h-screen">
      <PageContainer variant="management" hasMobileHeader>
        <DestinationHeader destination="sources" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <SourceListSkeleton />
      </PageContainer>
    </Surface>
  );
}
