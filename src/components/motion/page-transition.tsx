"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";

const noop = () => {};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reducedMotion ? false : { opacity: 0.985, y: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : transitions.page}
      // Avoid WAAPI opacity fill stall in WebKit while preserving GPU transition semantics.
      onUpdate={noop}
      className="flex min-w-0 w-full flex-1 flex-col"
      data-testid="page-transition"
    >
      {children}
    </motion.div>
  );
}
