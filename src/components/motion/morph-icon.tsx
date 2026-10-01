"use client";

import * as React from "react";
import { MorphIcon as MorphiconsIcon } from "morphicons/react";
import { cn } from "@/shared/utils/cn";

export type MorphIconData = string;

export interface MorphIconProps
  extends Omit<
    React.ComponentProps<typeof MorphiconsIcon>,
    "icon" | "reducedMotion"
  > {
  icon: MorphIconData;
}

/**
 * Yomirra's only package boundary for path morphing.
 * Feature components must import this wrapper instead of morphicons directly.
 */
export function MorphIcon({
  icon,
  className,
  spring = "snappy",
  ...props
}: MorphIconProps) {
  return (
    <MorphiconsIcon
      {...props}
      icon={icon}
      spring={spring}
      reducedMotion="user"
      className={cn("shrink-0", className)}
    />
  );
}
