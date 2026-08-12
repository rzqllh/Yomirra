import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title="Updates" description="Pembaruan chapter komik terbaru" />
      </div>
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-20 md:pt-24 relative z-10 flex flex-col gap-6">
        
        <div className="flex gap-2 overflow-hidden">
          <Skeleton className="h-8 w-24 rounded-full shrink-0" />
          <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border-subtle bg-surface-base">
              <Skeleton className="h-24 w-16 md:w-20 rounded-lg shrink-0" />
              <div className="flex flex-col flex-1 gap-2 py-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="mt-auto flex justify-between">
                   <Skeleton className="h-3 w-16" />
                   <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
