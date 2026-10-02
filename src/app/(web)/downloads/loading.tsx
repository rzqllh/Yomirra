import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { YomirraSurface, PageContainer, ContentLane } from "@/components/ui/layout";
import { Download } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Unduhan"
          subtitle="Kelola chapter yang tersimpan untuk dibaca offline."
          icon={<Download size={24} weight="duotone" />}
          hideDesktop
        />
        <h1 className="sr-only">Unduhan</h1>

        <ContentLane variant="focused" className="flex flex-col gap-6">
          <Skeleton className="h-20 w-full rounded-2xl" />

          <div className="w-full">
          <Skeleton className="mb-6 h-10 w-full max-w-xs rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3.5 rounded-2xl border border-border-subtle/80 bg-surface-raised p-3.5 sm:gap-4 sm:p-4"
              >
                <Skeleton className="h-24 w-16 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="size-10 shrink-0 rounded-xl" />
              </div>
            ))}
          </div>
          </div>
        </ContentLane>
      </PageContainer>
    </YomirraSurface>
  );
}
