import { cn } from "@/shared/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("ink-skeleton rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
