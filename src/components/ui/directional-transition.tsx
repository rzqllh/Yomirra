"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Route-level cross-fade transition for Yomirra discovery and destination pages.
 * Runs 150-180ms easeOut opacity/subtle transform to prevent abrupt hard-cuts.
 * Drops to instant swap when prefers-reduced-motion is active.
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reducedMotion ? false : { opacity: 0.96, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="flex-1 flex flex-col min-w-0 w-full"
    >
      {children}
    </motion.div>
  );
}
