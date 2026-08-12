import * as React from "react"
import { PageHeader } from "./header"
import { cn } from "@/shared/utils/cn"

interface MobilePageShellProps {
  children: React.ReactNode
  title: string
  showBack?: boolean
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function MobilePageShell({
  children,
  title,
  showBack,
  action,
  icon,
  className,
}: MobilePageShellProps) {
  return (
    <div className={cn("flex flex-col min-h-screen bg-surface-base", className)}>
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title={title} showBack={showBack} actions={action} icon={icon} />
      </div>
      <div className={cn("flex-1", className)}>{children}</div>
    </div>
  )
}
