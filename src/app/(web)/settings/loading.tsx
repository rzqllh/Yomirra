import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { Gear } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Pengaturan"
          subtitle="Atur tampilan, bacaan, dan data Yomirra."
          icon={<Gear size={24} weight="duotone" />}
        />

        <div className="space-y-6 md:space-y-8 xl:columns-2 xl:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <section
              key={i}
              className="mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised"
            >
              <div className="border-b border-border-subtle px-4 py-3">
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              {Array.from({ length: i % 2 === 0 ? 2 : 1 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-4 border-b border-border-subtle/50 p-4 last:border-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <Skeleton className="h-3 w-4/5 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-16 shrink-0 rounded-xl" />
                </div>
              ))}
            </section>
          ))}
        </div>
      </PageContainer>
    </YomirraSurface>
  );
}
