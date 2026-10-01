"use client";

import * as React from "react";
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/shared/utils/cn";
import { transitions } from "@/shared/lib/motion/tokens";

interface AnimatedStateIconProps
  extends Omit<IconProps, "children" | "ref"> {
  active: boolean;
  activeIcon: PhosphorIcon;
  inactiveIcon: PhosphorIcon;
  activeWeight?: IconProps["weight"];
  inactiveWeight?: IconProps["weight"];
  label?: string;
}

export function AnimatedStateIcon({
  active,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
  activeWeight = "fill",
  inactiveWeight = "regular",
  size = 20,
  className,
  label,
  ...iconProps
}: AnimatedStateIconProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <motion.span
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          opacity: active ? 0 : 1,
          scale: reducedMotion ? 1 : active ? 0.92 : 1,
        }}
        transition={reducedMotion ? { duration: 0 } : transitions.snappy}
      >
        <InactiveIcon
          {...iconProps}
          size={size}
          weight={inactiveWeight}
          aria-hidden="true"
        />
      </motion.span>
      <motion.span
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          scale: reducedMotion ? 1 : active ? 1 : 0.92,
        }}
        transition={reducedMotion ? { duration: 0 } : transitions.snappy}
      >
        <ActiveIcon
          {...iconProps}
          size={size}
          weight={activeWeight}
          aria-hidden="true"
        />
      </motion.span>
    </span>
  );
}
