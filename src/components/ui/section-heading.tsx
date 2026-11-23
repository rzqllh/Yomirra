import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * Standardized Section Heading for content blocks, rails, and shelves.
 */
export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ className, title, subtitle, action, badge, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-end justify-between gap-4 w-full", className)}
        {...props}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-text-primary min-w-0 break-words">
              {title}
            </h2>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs md:text-sm text-text-secondary mt-1 leading-relaxed break-words">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);
SectionHeading.displayName = "SectionHeading";
