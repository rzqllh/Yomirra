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
      className="fixed z-[99999] left-0 right-0 h-[2px] pointer-events-none"
      style={{ top: 'var(--safe-top, 0px)' }}
    >
      <motion.div
        className="h-full bg-accent origin-left"
        style={{ scaleX }}
      />
    </div>
  );
}
