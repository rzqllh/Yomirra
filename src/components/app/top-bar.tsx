"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

interface TopBarProps {
  title: string
  showBack?: boolean
  action?: React.ReactNode
  className?: string
}

export function TopBar({
  title,
  showBack = false,
  action,
  className,
}: TopBarProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] flex h-[calc(var(--mobile-header-height)+var(--safe-top))] w-full items-center justify-between border-b border-border-subtle/50 bg-surface-base/80 px-4 pt-[var(--safe-top)] shadow-sm backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-surface-raised active:bg-surface-overlay"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
        )}
        <h1 className="text-lg font-bold leading-none text-text-primary">
          {title}
        </h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}
