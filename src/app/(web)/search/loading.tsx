import { YomirraPageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <YomirraPageHeader title="Cari Komik" showBack={false} variant="auto" />
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-24 relative z-10 flex flex-col gap-6">
        {/* Search Input Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-[52px] flex-1 rounded-2xl" />
          <Skeleton className="h-[52px] w-[52px] shrink-0 rounded-2xl" />
        </div>
        
        {/* Chips Skeleton */}
        <div className="flex gap-2 overflow-hidden">
          <Skeleton className="h-8 w-24 rounded-full shrink-0" />
          <Skeleton className="h-8 w-32 rounded-full shrink-0" />
          <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        </div>

        {/* Results Grid Skeleton */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5 mt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
