"use client";

import * as React from "react";
import type { Icon as PhosphorIcon, IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface IconProps extends Omit<PhosphorIconProps, "ref"> {
  icon: PhosphorIcon | React.ComponentType<PhosphorIconProps>;
  strokeWidth?: number;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size = 20, weight = "regular", className, color = "currentColor", strokeWidth, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        size={size}
        weight={weight}
        color={color}
        className={cn("shrink-0 pointer-events-none transition-colors", className)}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";
