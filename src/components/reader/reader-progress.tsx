"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "motion/react";

export function ReaderProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div
      className="fixed z-[99999] top-0 left-0 right-0 h-[3px] pointer-events-none"
    >
      <motion.div
        className="h-full bg-accent origin-left shadow-[0_0_8px_var(--color-accent),0_1px_2px_rgba(0,0,0,0.3)]"
        style={{ scaleX }}
      />
    </div>
  );
}
