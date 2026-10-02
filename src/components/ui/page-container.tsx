import * as React from "react";
import { cn } from "@/shared/utils/cn";

export type ContainerVariant = "wide" | "management" | "focused";
export type ContentLaneVariant = "full" | "management" | "focused";

const contentLaneMaxWidth: Record<ContentLaneVariant, string> = {
  full: "max-w-none",
  management: "max-w-[1200px]",
  focused: "max-w-[1040px]",
};

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Semantic page archetype retained for call-site intent and diagnostics.
   * Outer page geometry is canonical across ordinary destinations.
   */
  variant?: ContainerVariant;
  hasMobileHeader?: boolean;
}

/**
 * Canonical destination-page frame.
 *
 * Every ordinary route shares the same outer left/right edges and gutters.
 * Narrower management/focused layouts belong inside ContentLane so route
 * transitions do not visibly resize the page canvas.
 */
export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, variant = "wide", hasMobileHeader = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-container-variant={variant}
        className={cn(
          "w-full max-w-none mx-auto px-4 pb-12 md:px-8 md:pt-8 md:pb-16 xl:px-10 flex flex-col gap-6",
          hasMobileHeader
            ? "pt-[calc(var(--safe-top,0px)+var(--mobile-header-height)+16px)]"
            : "pt-[calc(var(--safe-top,0px)+16px)]",
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

export interface ContentLaneProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ContentLaneVariant;
}

/**
 * Optional inner content lane for utilities or management content that should
 * remain readable without changing the canonical outer page frame.
 */
export const ContentLane = React.forwardRef<HTMLDivElement, ContentLaneProps>(
  ({ className, variant = "full", ...props }, ref) => (
    <div
      ref={ref}
      data-content-lane={variant}
      className={cn("w-full mx-auto", contentLaneMaxWidth[variant], className)}
      {...props}
    />
  )
);
ContentLane.displayName = "ContentLane";
