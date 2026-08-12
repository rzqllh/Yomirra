import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] text-text-primary">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title="" showBack={true} />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 relative z-10 flex flex-col md:flex-row gap-5 md:gap-8">
        
        {/* Mobile Info Card Skeleton */}
        <div className="relative z-10 w-full mt-[calc(var(--safe-top))] flex flex-col gap-4 md:hidden">
          <div className="rounded-[32px] border border-border-glass bg-surface-glass/95 backdrop-blur-3xl shadow-glass p-5 flex flex-col gap-5">
            <div className="flex gap-4">
              <Skeleton className="w-[104px] h-[156px] rounded-2xl shrink-0" />
              <div className="flex flex-col flex-1 py-1">
                <Skeleton className="w-full h-5 rounded-md mb-1.5" />
                <Skeleton className="w-3/4 h-5 rounded-md mb-3" />
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-12 h-5 rounded-full" />
                  <Skeleton className="w-16 h-5 rounded-full" />
                </div>
                <Skeleton className="w-24 h-4 rounded-md mt-auto" />
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

        {/* Mobile Description Card Skeleton */}
        <div className="md:hidden rounded-[32px] border border-border-glass bg-surface-glass/95 backdrop-blur-3xl shadow-glass p-5 flex flex-col gap-4">
          <Skeleton className="w-24 h-4 rounded-md" />
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-3/4 h-4 rounded-md" />
            <Skeleton className="w-1/3 h-4 rounded-md mt-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-14 h-6 rounded-full" />
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
          <div className="hidden md:flex flex-col gap-4 mb-8">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="w-1/2 h-12 rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="w-11 h-11 rounded-full" />
                <Skeleton className="w-11 h-11 rounded-full" />
                <Skeleton className="w-11 h-11 rounded-full" />
              </div>
            </div>
            <Skeleton className="w-32 h-5 rounded-md" />
          </div>

          <div className="hidden md:flex rounded-[32px] border border-border-glass bg-surface-glass/95 backdrop-blur-3xl shadow-glass p-8 flex-col mb-8">
            <Skeleton className="w-24 h-4 rounded-md mb-6" />
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-3/4 h-4 rounded-md" />
            </div>
            <div className="flex gap-2 mt-6">
              <Skeleton className="w-20 h-8 rounded-full" />
              <Skeleton className="w-24 h-8 rounded-full" />
            </div>
          </div>

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
