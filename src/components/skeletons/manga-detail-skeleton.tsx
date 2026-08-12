import { Skeleton } from "@/components/ui/skeleton"

export function MangaDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full min-h-screen">
      {/* Hero card — mirrors mobile glassmorphism card rounded-[32px] p-5 */}
      <div className="rounded-[32px] border border-border-glass bg-surface-glass/80 backdrop-blur-3xl mx-4 mt-20 p-5 flex flex-col gap-5">
        {/* Cover + meta row */}
        <div className="flex gap-4">
          {/* Cover: w-[104px] aspect-[2/3] rounded-2xl */}
          <Skeleton className="w-[104px] shrink-0 rounded-2xl" style={{ aspectRatio: "2/3" }} />
          <div className="flex flex-col flex-1 py-1 gap-2">
            {/* Title: 3 lines, font-black */}
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
            {/* Badges row: score + status */}
            <div className="flex gap-2 mt-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            {/* Author + source */}
            <Skeleton className="h-3.5 w-2/3 mt-1" />
          </div>
        </div>

        {/* CTA button: h-[52px] rounded-2xl */}
        <Skeleton className="h-[52px] w-full rounded-2xl" />

        {/* Progress bar area */}
        <div className="flex flex-col gap-1.5 px-1 -mt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        {/* Actions bar: h-[72px] rounded-2xl with 3 equal sections */}
        <div className="flex w-full h-[72px] rounded-2xl border border-border-default/50 overflow-hidden divide-x divide-border-default/30">
          <Skeleton className="flex-1 rounded-none" />
          <Skeleton className="flex-1 rounded-none" />
          <Skeleton className="flex-1 rounded-none" />
        </div>
      </div>

      {/* Genres/tags row */}
      <div className="px-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Synopsis lines */}
      <div className="px-4 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Chapter list header + search */}
      <div className="mt-4 px-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
        {/* Search + sort toolbar */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-[44px] flex-1 rounded-2xl" />
          <Skeleton className="h-[44px] w-[44px] rounded-2xl shrink-0" />
        </div>
      </div>

      {/* Chapter rows — mirrors ChapterRow: py-3 border-b, title + date + download */}
      <div className="px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border-default/40 last:border-b-0">
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
            <div className="pl-3 border-l border-border-default/50 shrink-0">
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
