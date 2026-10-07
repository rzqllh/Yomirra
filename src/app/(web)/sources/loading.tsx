import { PageHeader } from "@/components/chrome/header";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrives } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Sumber"
          subtitle="Pilih sumber yang digunakan untuk menjelajah dan membaca komik."
          icon={<HardDrives size={24} weight="duotone" />}
          hideDesktop
        />
        <h1 className="sr-only">Sumber</h1>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full max-w-md rounded-2xl" />
        <SourceListSkeleton />
      </PageContainer>
    </YomirraSurface>
  );
}
