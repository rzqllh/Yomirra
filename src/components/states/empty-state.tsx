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
        <div className="mb-6 flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-surface-raised to-surface-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_16px_rgba(0,0,0,0.4)] border border-border-subtle relative">
          <div className="absolute inset-0 rounded-full bg-accent/5 blur-xl"></div>
          <div className="relative z-10 text-accent">{icon}</div>
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
