"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface StatusBarBlurProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Native iOS-styled Progressive Status Bar Blur Layer.
 * Locked strictly to `env(safe-area-inset-top, 0px)`.
 * Does not exceed the status bar boundary (enforced via `clip-path: inset(0 0 0 0)`),
 * with a smooth progressive gradient mask from the very top to the status bar edge.
 */
export function StatusBarBlur({ className, style }: StatusBarBlurProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-x-0 top-0 pointer-events-none z-[60] overflow-hidden select-none h-[env(safe-area-inset-top,0px)] max-h-[env(safe-area-inset-top,0px)]",
        className
      )}
      style={{
        height: "env(safe-area-inset-top, 0px)",
        maxHeight: "env(safe-area-inset-top, 0px)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        clipPath: "inset(0 0 0 0)",
        WebkitClipPath: "inset(0 0 0 0)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.1) 88%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.1) 88%, rgba(0,0,0,0) 100%)",
        ...style,
      }}
    />
  );
}
