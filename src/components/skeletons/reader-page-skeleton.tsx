import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/shared/utils/cn"

export function ReaderPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full justify-center", className)}>
      <Skeleton className="aspect-[2/3] w-full max-w-[var(--reader-page-max-width)] rounded-none bg-surface-raised/20" />
    </div>
  )
}
