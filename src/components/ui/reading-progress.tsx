"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

import { motion, useReducedMotion } from "motion/react";

export interface ReadingProgressProps {
  /** Progress percentage between 0 and 100 */
  value: number;
  /** Size variant of the progress bar */
  size?: "sm" | "md";
  /** Color variant of the progress bar */
  variant?: "default" | "success";
  /** Whether to render percentage text badge next to bar */
  showLabel?: boolean;
  /** ClassName override for outer container */
  className?: string;
}

export function ReadingProgress({
  value,
  size = "sm",
  variant = "default",
  showLabel = false,
  className,
}: ReadingProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";
  const isSuccess = variant === "success" || clampedValue >= 100;
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("flex-1 bg-surface-raised overflow-hidden rounded-full", heightClass)}
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            isSuccess ? "bg-status-success-fg" : "bg-accent"
          )}
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold shrink-0 min-w-[32px] text-right",
            isSuccess ? "text-status-success-fg" : "text-accent"
          )}
        >
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
