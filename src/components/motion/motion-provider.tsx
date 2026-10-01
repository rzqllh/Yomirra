"use client";

import { MotionConfig } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={transitions.layout}
    >
      {children}
    </MotionConfig>
  );
}
