import * as React from "react";
import { cn } from "@/shared/utils/cn";

export type PageToolbarProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Standardized compositional toolbar container for Yomirra pages.
 * Accommodates primary control rows (search, actions) and secondary filter/format rails.
 */
export const PageToolbar = React.forwardRef<HTMLDivElement, PageToolbarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3 w-full", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageToolbar.displayName = "PageToolbar";
