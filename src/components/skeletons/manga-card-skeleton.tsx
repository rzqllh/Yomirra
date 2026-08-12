import { Skeleton } from "@/components/ui/skeleton"

export function MangaCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "editorial" | "shelf" | "history" }) {
  if (variant === "history") {
    // Mirrors HistoryCard: flex gap-4 p-3, cover h-[84px] w-[60px] rounded-sm, action h-8 w-8 rounded-full
    return (
      <div className="flex items-center gap-4 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/50 w-full">
        <Skeleton className="h-[84px] w-[60px] rounded-sm shrink-0" />
        <div className="flex-1 flex flex-col justify-center space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </div>
        {/* Play button: real is h-8 w-8 rounded-full */}
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      </div>
    )
  }

  if (variant === "editorial") {
    return (
      <div className="relative flex flex-col w-full rounded-lg overflow-hidden bg-surface-muted border border-border-default shadow-sm aspect-[3/4]">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          <Skeleton className="h-4 w-8 rounded-sm bg-black/20" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end">
          <Skeleton className="h-4 w-3/4 mb-2 bg-white/20" />
          <Skeleton className="h-3 w-1/2 bg-white/20" />
        </div>
      </div>
    )
  }

  if (variant === "shelf") {
    // Mirrors ShelfCard: cover aspect-[2/3] rounded-2xl, metadata row mb-1.5, title 2-line min-h-[2.4em], bottom chapter/score row
    return (
      <div className="relative flex flex-col w-full">
        {/* Cover — matches aspect-[2/3] + rounded-2xl */}
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl mb-3">
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          {/* Source/rank badge top-left */}
          <div className="absolute top-2 left-2 z-20">
            <Skeleton className="h-4 w-10 rounded-full bg-black/20" />
          </div>
        </div>
        <div className="flex flex-col px-0.5">
          {/* Metadata row: format + source badge */}
          <Skeleton className="h-2.5 w-16 mb-1.5" />
          {/* Title — 2 lines, min-h mirrors min-h-[2.4em] at text-[13px] ≈ 34px */}
          <Skeleton className="h-3.5 w-full mb-1" />
          <Skeleton className="h-3.5 w-2/3 mb-2" />
          {/* Bottom row: chapter + score */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-2/5" />
            <Skeleton className="h-2.5 w-10" />
          </div>
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
