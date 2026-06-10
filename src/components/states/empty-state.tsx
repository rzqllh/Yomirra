import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "compact"
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        {icon && <div className="mb-2 text-text-muted">{icon}</div>}
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && (
          <p className="text-xs text-text-muted mt-1 max-w-[240px]">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex min-h-[40vh] flex-col items-center justify-center text-center px-4",
      className
    )}>
      {icon && (
        <div className="mb-6 rounded-full bg-surface-raised p-6 shadow-soft border border-border-subtle">
          {icon}
        </div>
      )}
      <h2 className="mb-2 text-xl font-bold text-text-primary">{title}</h2>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
