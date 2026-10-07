import { PageHeader } from "@/components/chrome/header";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdatesSkeleton } from "@/components/skeletons/updates-skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Jadwal Mingguan"
          description="Lihat perkiraan jadwal chapter baru dari komik yang kamu simpan."
          icon={<CalendarBlank size={24} weight="duotone" />}
          showBack
        />

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
    </YomirraSurface>
  );
}
