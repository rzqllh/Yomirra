import * as React from "react";
import { cn } from "@/shared/utils/cn";

export type PageContainerProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Standardized pure layout container for Yomirra pages.
 * Enforces Home-equivalent fluid width, horizontal gutters, and vertical rhythm.
 */
export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-none px-4 pb-12 pt-[calc(var(--safe-top,0px)+16px)] md:px-8 md:pt-8 md:pb-16 xl:px-10 flex flex-col gap-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageContainer.displayName = "PageContainer";
