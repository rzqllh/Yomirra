import * as React from "react"
import { TopBar } from "./top-bar"
import { cn } from "@/shared/utils/cn"

interface MobilePageShellProps {
  title: string
  showBack?: boolean
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function MobilePageShell({
  title,
  showBack,
  action,
  children,
  className,
}: MobilePageShellProps) {
  return (
    <div className="flex min-h-full flex-col max-w-5xl mx-auto w-full">
      <div className="md:hidden">
        <TopBar title={title} showBack={showBack} action={action} />
      </div>
      <div className={cn("flex-1", className)}>{children}</div>
    </div>
  )
}
