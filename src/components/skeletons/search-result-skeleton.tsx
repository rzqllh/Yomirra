import { MangaGridSkeleton } from "./manga-grid-skeleton"

export function SearchResultSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="h-6 w-32 rounded bg-surface-raised motion-safe:animate-pulse" />
      <MangaGridSkeleton count={8} className="grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8" />
    </div>
  )
}
