import * as React from "react";
import { cn } from "@/shared/utils/cn";

export type ContainerVariant = "wide" | "management" | "focused";

const containerMaxWidth: Record<ContainerVariant, string> = {
  wide: "max-w-none",
  management: "max-w-none",
  focused: "max-w-none",
};

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ContainerVariant;
}

/**
 * Standardized layout container for Yomirra pages.
 * Enforces Home-equivalent fluid width, horizontal gutters (px-4 md:px-8 xl:px-10), and vertical rhythm.
 */
export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, variant = "wide", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-none mx-auto px-4 pb-12 pt-[calc(var(--safe-top,0px)+16px)] md:px-8 md:pt-8 md:pb-16 xl:px-10 flex flex-col gap-6",
          containerMaxWidth[variant],
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
