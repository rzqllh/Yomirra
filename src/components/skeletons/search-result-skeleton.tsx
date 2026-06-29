import { MangaGridSkeleton } from "./manga-grid-skeleton"

export function SearchResultSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="h-6 w-32 rounded bg-surface-raised motion-safe:animate-pulse" />
      <MangaGridSkeleton count={8} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" />
    </div>
  )
}
