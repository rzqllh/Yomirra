import * as React from "react";
import { cn } from "@/shared/utils/cn";

export type ContainerVariant = "wide" | "management" | "focused";

const containerMaxWidth: Record<ContainerVariant, string> = {
  wide: "max-w-[1280px]",
  management: "max-w-[1120px]",
  focused: "max-w-[960px]",
};

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ContainerVariant;
  hasMobileHeader?: boolean;
}

/**
 * Semantic page-width contract:
 * - wide: discovery/catalog surfaces
 * - management: structured settings/source management
 * - focused: utility/task surfaces
 *
 * Outer gutters remain shared so page archetypes keep one left-edge rhythm.
 */
export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, variant = "wide", hasMobileHeader = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full mx-auto px-4 pb-12 md:px-8 md:pt-8 md:pb-16 xl:px-10 flex flex-col gap-6",
          hasMobileHeader
            ? "pt-[calc(var(--safe-top,0px)+var(--mobile-header-height)+16px)]"
            : "pt-[calc(var(--safe-top,0px)+16px)]",
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
