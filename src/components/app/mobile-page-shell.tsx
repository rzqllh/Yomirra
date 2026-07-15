import * as React from "react"
import { YomirraPageHeader } from "./header"
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
      <div className="md:hidden">
        <YomirraPageHeader title={title} showBack={showBack} action={action} icon={icon} variant="auto" />
      </div>
      <div className={cn("flex-1", className)}>{children}</div>
    </div>
  )
}
