"use client";

import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { motion, useReducedMotion } from "motion/react"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "compact"
  fullHeight?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  fullHeight = false,
  className,
  ...props
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  const iconMotion = prefersReducedMotion ? undefined : {
    initial: { opacity: 0, scale: 0.95, y: 4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16 animate-in fade-in duration-500",
        fullHeight ? "min-h-100 flex-1" : "w-full",
        className
      )}
      {...props}
    >
      {icon && (
        <motion.div 
          initial={iconMotion?.initial}
          animate={iconMotion?.animate}
          transition={iconMotion?.transition}
          className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-surface-raised/40 border border-border-subtle/40 shadow-sm"
        >
          <div className="relative z-10 text-text-muted drop-shadow-sm scale-110">
            {icon}
          </div>
        </motion.div>
      )}
      
      <h2 className="mb-2 text-lg font-bold text-text-primary tracking-tight">{title}</h2>
      
      {description && (
        <div className="mb-8 max-w-70 text-sm font-medium text-text-muted leading-relaxed balance-text">
          {description}
        </div>
      )}
      
      {action && (
        <div className="flex items-center justify-center gap-3">
          {action}
        </div>
      )}
    </div>
  )
}
