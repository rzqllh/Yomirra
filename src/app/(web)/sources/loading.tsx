import { PageHeader } from "@/components/chrome/header";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrives } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <Surface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Sumber"
          subtitle="Pilih sumber yang digunakan untuk menjelajah dan membaca komik."
          icon={<HardDrives size={24} weight="regular" />}
        />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <SourceListSkeleton />
      </PageContainer>
    </Surface>
  );
}
