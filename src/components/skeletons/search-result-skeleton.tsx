import { MangaGridSkeleton } from "./manga-grid-skeleton"

export function SearchResultSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="h-6 w-32 rounded bg-surface-raised animate-pulse" />
      <MangaGridSkeleton count={8} />
    </div>
  )
}
