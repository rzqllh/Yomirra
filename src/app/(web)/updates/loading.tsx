import { DestinationHeader } from "@/components/chrome/header";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdatesSkeleton } from "@/components/skeletons/updates-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function Loading() {
  return (
    <Surface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <DestinationHeader destination="updates" />

        <div className="mt-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-hidden py-1">
            <Skeleton className="h-9 w-20 shrink-0 rounded-xl" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-16 shrink-0 rounded-xl" />
            ))}
          </div>
          <UpdatesSkeleton count={9} />
        </div>
      </PageContainer>
    </Surface>
  );
}
