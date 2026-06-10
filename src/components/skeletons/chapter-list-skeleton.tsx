import { Skeleton } from "@/components/ui/skeleton"

export function ChapterListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  )
}
