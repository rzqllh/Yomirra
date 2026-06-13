"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { motion } from "motion/react";

interface SegmentedTabsProps {
  options: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "fullWidth" | "compact";
  layoutIdPrefix?: string;
}

export function SegmentedTabs({ 
  options, 
  activeId, 
  onChange, 
  className, 
  variant = "fullWidth",
  layoutIdPrefix = "segmented-tab"
}: SegmentedTabsProps) {
  return (
    <div className={cn(
      "relative flex items-center rounded-full bg-surface-muted/50 p-1 border border-border-glass shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]",
      variant === "fullWidth" ? "w-full" : "w-fit",
      className
    )}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 flex items-center justify-center rounded-full px-4 py-2 text-[14px] font-bold transition-colors outline-none",
              variant === "fullWidth" ? "flex-1" : "min-w-20",
              isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-indicator`}
                className="absolute inset-0 rounded-full bg-surface-base shadow-sm border border-border-subtle"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-20">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
