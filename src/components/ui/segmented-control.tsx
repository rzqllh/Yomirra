"use client"

import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
  layoutId?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  fullWidth = false,
  layoutId = "segmented-pill"
}: SegmentedControlProps) {

  return (
    <div 
      className={cn( "relative flex items-center rounded-xl bg-surface-muted/80 p-1 border-border-subtle/50 backdrop-blur-xl -inner", fullWidth ? "w-full" : "inline-flex", className )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative z-10 flex items-center justify-center rounded-lg py-[6px] px-4 text-[13px] font-semibold transition-colors duration-300 outline-none select-none tracking-normal whitespace-nowrap",
              fullWidth ? "flex-1" : "flex-1 sm:flex-none sm:min-w-[100px]",
              isActive ? "text-text-primary" : "text-text-muted hover:text-text-primary"
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 z-0 rounded-lg bg-surface-overlay shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-black/40 border border-border-default/40"
                initial={false}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
