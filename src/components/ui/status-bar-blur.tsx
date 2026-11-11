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
        "fixed inset-x-0 top-0 h-[env(safe-area-inset-top,0px)] max-h-[env(safe-area-inset-top,0px)] pointer-events-none z-[60] overflow-hidden select-none isolate bg-transparent",
        className
      )}
      style={{
        contain: "paint",
        clipPath: "inset(0)",
        WebkitClipPath: "inset(0)",
        ...style,
      }}
    >
      <div
        className="absolute inset-0 bg-transparent"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0) 80%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0) 80%, rgba(0,0,0,0) 100%)",
        }}
      />
    </div>
  );
}
