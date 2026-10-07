import { PageHeader } from "@/components/chrome/header";
import { PageContainer } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-base pb-28 md:pb-10">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Akun & Sinkronisasi"
          showBack
          backHref="/settings"
          description="Kelola akun dan sinkronisasi bacaanmu."
        />
        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col items-center gap-5 rounded-[28px] border border-border-glass bg-surface-glass p-6 sm:flex-row sm:items-start">
            <Skeleton className="size-20 shrink-0 rounded-2xl" />
            <div className="w-full flex-1 space-y-3">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4 rounded-[28px] border border-border-glass bg-surface-glass p-6">
            <Skeleton className="h-5 w-52 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="rounded-[28px] border border-border-glass bg-surface-glass p-6">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
