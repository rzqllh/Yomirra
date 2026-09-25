import { Skeleton } from "@/components/ui/skeleton"

export function MangaCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "editorial" | "shelf" | "history" | "leaderboard" | "compact" }) {
  if (variant === "history") {
    // Mirrors HistoryCard: flex gap-4 p-3, cover h-[84px] w-[60px] rounded-sm, action h-8 w-8 rounded-lg
    return (
      <div className="flex items-center gap-4 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/50 w-full">
        <Skeleton className="h-[84px] w-[60px] rounded-sm shrink-0" />
        <div className="flex-1 flex flex-col justify-center space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </div>
        {/* Play button: real is h-8 w-8 rounded-lg */}
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      </div>
    )
  }

  if (variant === "leaderboard") {
    // Mirrors LeaderboardRow: flex gap-3.5 py-2.5 px-3, rank w-9, cover w-[50px] h-[68px] sm:w-[60px] sm:h-[80px] rounded-sm
    return (
      <div className="flex items-center gap-3.5 py-2.5 px-3 rounded md:rounded-xl bg-surface-base/40 border border-border-subtle/40 w-full">
        <Skeleton className="w-9 h-8 shrink-0 rounded-md" />
        <Skeleton className="w-[50px] h-[68px] sm:w-[60px] sm:h-[80px] shrink-0 rounded-sm" />
        <div className="flex-1 flex flex-col justify-center gap-2 py-0.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
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
    // Mirrors ShelfCard: cover aspect-[2/3] rounded-xl, metadata row mb-1.5, title 2-line min-h-[2.4em], bottom chapter/score row
    return (
      <div className="relative flex flex-col w-full">
        {/* Cover — matches aspect-[2/3] + rounded-xl */}
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl mb-3">
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          {/* Source/rank badge top-left */}
          <div className="absolute top-2 left-2 z-20">
            <Skeleton className="h-4 w-10 rounded-md bg-black/20" />
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

  if (variant === "list" || variant === "compact") {
    return (
      <div className="flex items-stretch p-3 sm:p-3.5 rounded-xl bg-surface-raised border border-border-subtle/80 shadow-xs w-full gap-3 sm:gap-4 overflow-hidden">
        <Skeleton className="w-[84px] sm:w-[96px] md:w-[104px] aspect-[2/3] shrink-0 rounded-lg" />
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-lg shrink-0 -mt-0.5 -mr-1" />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Skeleton className="h-3.5 w-16 rounded-[6px]" />
              <Skeleton className="h-3.5 w-14 rounded-[6px]" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-3 w-12 rounded-[6px]" />
              <Skeleton className="h-3 w-16 rounded-[6px]" />
            </div>
            <div className="space-y-1 mt-2.5">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-4/5 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid / default variant
  return (
    <div className="flex items-center gap-3 p-2 w-full">
      <Skeleton className="aspect-square h-14 w-14 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
    </div>
  )
}
