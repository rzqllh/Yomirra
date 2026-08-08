"use client";

import * as React from "react";

/**
 * Uniform wrapper for page-level route transitions across all pages in Yomirra.
 * Since Next.js View Transitions API is enabled, we defer to native view transitions
 * to prevent hydration mismatches and white screens caused by AnimatePresence conflicts.
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      {children}
    </div>
  );
}
