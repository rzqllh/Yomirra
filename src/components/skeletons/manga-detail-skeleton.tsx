import { Skeleton } from "@/components/ui/skeleton"

export function MangaDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <Skeleton className="aspect-[3/4] w-28 rounded-md border-2 border-surface-raised" />
          <div className="flex flex-1 flex-col gap-2 pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </div>
      
      <div className="px-4">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      
      <div className="mt-4 flex flex-col gap-2 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
