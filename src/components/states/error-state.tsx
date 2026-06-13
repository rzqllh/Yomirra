"use client";

import * as React from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  variant?: "default" | "compact" | "inline"
  className?: string
}

export function ErrorState({
  title = "Terjadi kesalahan",
  description = "Tidak dapat memuat data. Coba lagi nanti.",
  onRetry,
  retryLabel = "Coba lagi",
  variant = "default",
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 rounded-md bg-semantic-error/10 border border-semantic-error/20 px-4 py-3", className)}>
        <WarningCircle size={20} className="text-semantic-error shrink-0" weight="duotone" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <WarningCircle size={32} className="text-semantic-error mb-2" weight="duotone" />
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="text-xs text-text-muted mt-1 max-w-[240px]">{description}</p>}
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-3">
            {retryLabel}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex min-h-[40vh] flex-col items-center justify-center text-center px-4",
      className
    )}>
      <div className="mb-6 rounded-full bg-semantic-error/10 p-6 border border-semantic-error/20">
        <WarningCircle size={40} className="text-semantic-error" weight="duotone" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-text-primary">{title}</h2>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
