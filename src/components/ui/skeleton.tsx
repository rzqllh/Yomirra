import { cn } from "@/shared/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("motion-safe:animate-pulse rounded-[var(--radius-md)] bg-surface-raised", className)}
      {...props}
    />
  )
}

export { Skeleton }
