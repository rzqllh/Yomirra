import { Skeleton } from "@/components/ui/skeleton";
import { YomirraPageHeader } from "@/components/app/header";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12">
      {/* Background tinted */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-background" />
      </div>

      <YomirraPageHeader title="Memuat manga..." showBack variant="auto" />

      {/* Main Content Container */}
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-20 md:pt-16 relative z-10 flex flex-col md:flex-row gap-5 md:gap-8">
        
        {/* Mobile Info Card Skeleton */}
        <div className="relative z-10 w-full mt-[calc(var(--safe-top))] flex flex-col gap-4 md:hidden">
          <div className="rounded-[32px] border border-border-glass bg-surface-glass/95 backdrop-blur-3xl shadow-glass p-5 flex flex-col gap-5">
            <div className="flex gap-4">
              <Skeleton className="w-[104px] h-[156px] rounded-2xl shrink-0" />
              <div className="flex flex-col gap-3 flex-1 pt-2">
                <Skeleton className="w-full h-5 rounded-md" />
                <Skeleton className="w-3/4 h-5 rounded-md" />
                <Skeleton className="w-1/2 h-3 rounded-md mt-2" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-12 rounded-[24px]" />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="w-full h-12 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Left Column Skeleton */}
        <div className="hidden md:flex w-[240px] lg:w-[280px] shrink-0 flex-col gap-5 sticky top-24 h-fit">
          <div className="rounded-[32px] border border-border-glass bg-surface-glass backdrop-blur-3xl shadow-glass p-5 flex flex-col gap-5">
             <Skeleton className="w-full aspect-[2/3] rounded-2xl" />
             <div className="flex flex-col gap-2">
                <Skeleton className="w-full h-12 rounded-[24px]" />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="w-full h-12 rounded-2xl" />
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Right Column / Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="rounded-[32px] border border-border-glass bg-surface-glass/95 backdrop-blur-3xl shadow-glass p-5 md:p-8 flex flex-col">
            <Skeleton className="w-32 h-4 mb-4 rounded-md" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton key={i} className="w-full h-[60px] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
