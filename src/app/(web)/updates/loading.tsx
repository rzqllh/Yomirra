import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdatesSkeleton } from "@/components/skeletons/updates-skeleton";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)] text-text-primary">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader
          title="Jadwal Rilis Mingguan"
          description="Pantau kalender update komik bookmark ala Notion (Senin – Minggu)"
          icon={<CalendarBlank size={24} weight="duotone" />}
          showBack={true}
        />
      </div>

      <div className="px-4 md:px-8 mt-2 flex flex-col gap-4">
        {/* Day selector tabs skeleton */}
        <div className="flex items-center gap-2 overflow-hidden py-1">
          <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
        </div>

        {/* Weekly updates cards skeleton */}
        <UpdatesSkeleton count={9} />
      </div>
    </div>
  );
}
