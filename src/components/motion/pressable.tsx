"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";
import { variants } from "@/shared/lib/motion/variants";

export function Pressable(props: HTMLMotionProps<"button">) {
  return (
    <motion.button
      variants={variants.pressable}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      transition={transitions.snappy}
      {...props}
    />
  );
}
