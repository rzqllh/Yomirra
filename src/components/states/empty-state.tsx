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
  variant = "default",
  fullHeight = false,
  className,
  ...props
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300", 
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-overlay text-text-muted ring-1 ring-border-default/50">
            {icon}
          </div>
        )}
        <p className="text-sm font-semibold text-text-primary tracking-tight">{title}</p>
        {description && (
          <div className="mt-1.5 max-w-[260px] text-xs text-text-muted leading-relaxed">
            {description}
          </div>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    )
  }

  const prefersReducedMotion = useReducedMotion()
  const floatAnimation = prefersReducedMotion ? {} : {
    y: [0, -6, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12 animate-in zoom-in-95 fade-in duration-300",
        fullHeight ? "min-h-[300px] flex-1" : "h-full w-full",
        className
      )}
      {...props}
    >
      {icon && (
        <motion.div 
          animate={floatAnimation}
          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-b from-surface-raised to-surface-base shadow-lg ring-1 ring-border-default/40 isolate"
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 -z-10 rounded-lg bg-accent/10 blur-2xl opacity-60 mix-blend-screen" />
          {/* Inner Highlight */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-accent/5 to-transparent opacity-50" />
          {/* Icon Container */}
          <div className="relative z-10 text-accent drop-shadow-md scale-110 pointer-events-none">
            {icon}
          </div>
        </motion.div>
      )}
      
      <h2 className="mb-2 text-xl font-bold text-text-primary tracking-tight">{title}</h2>
      
      {description && (
        <div className="mb-8 max-w-sm text-sm text-text-muted leading-relaxed balance-text">
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