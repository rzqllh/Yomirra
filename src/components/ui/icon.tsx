"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { cn } from "@/shared/utils/cn";

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  icon: IconSvgElement;
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon, size = 20, strokeWidth = 1.75, className, color = "currentColor", ...props }, ref) => {
    return (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        className={cn("shrink-0 pointer-events-none transition-colors", className)}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";
