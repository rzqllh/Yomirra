import { Skeleton } from "@/components/ui/skeleton"

export function MangaCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "editorial" | "shelf" }) {
  if (variant === "editorial") {
    return (
      <div className="relative flex flex-col w-full rounded-lg overflow-hidden bg-surface-muted border border-border-default shadow-sm aspect-[3/4]">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          <Skeleton className="h-4 w-8 rounded-sm bg-black/20" />
        </div>
        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end">
          <Skeleton className="h-4 w-3/4 mb-2 bg-white/20" />
          <Skeleton className="h-3 w-1/2 bg-white/20" />
        </div>
      </div>
    )
  }

  if (variant === "shelf") {
    return (
      <div className="relative flex flex-col w-full group">
        <div className="relative w-full aspect-[1/1.4] overflow-hidden rounded-md mb-2.5">
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          <div className="absolute top-1.5 left-1.5 z-20">
            <Skeleton className="h-4 w-8 rounded-xs bg-black/20" />
          </div>
        </div>
        <div className="flex flex-col px-0.5 space-y-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div className="flex w-full gap-3 p-3">
        <Skeleton className="h-[90px] w-[64px] rounded-md shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4 mt-2" />
        </div>
      </div>
    )
  }

  // Grid / default variant
  return (
    <div className="flex items-center gap-3 p-2 w-full">
      <Skeleton className="aspect-square h-14 w-14 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
    </div>
  )
}
