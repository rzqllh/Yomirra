import * as React from "react";
import { cn } from "@/shared/utils/cn";

/** Shared search and filter region for the two catalog destinations. */
export function CatalogControls({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "space-y-3 border-y border-border-subtle py-4 md:space-y-4 md:rounded-[16px] md:border md:bg-surface-raised/50 md:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}
