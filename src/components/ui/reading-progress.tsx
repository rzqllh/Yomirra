"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface ReadingProgressProps {
  /** Progress percentage between 0 and 100 */
  value: number;
  /** Size variant of the progress bar */
  size?: "sm" | "md";
  /** Whether to render percentage text badge next to bar */
  showLabel?: boolean;
  /** ClassName override for outer container */
  className?: string;
}

export function ReadingProgress({
  value,
  size = "sm",
  showLabel = false,
  className,
}: ReadingProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("flex-1 bg-surface-raised overflow-hidden rounded-full", heightClass)}
      >
        <div
          className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-accent shrink-0 min-w-[32px] text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
