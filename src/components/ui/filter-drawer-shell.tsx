"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Funnel } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

// ---------------------------------------------------------------------------
// FilterSection
// ---------------------------------------------------------------------------

interface FilterSectionProps {
  title: string;
  layout?: "wrap" | "grid";
  children: React.ReactNode;
}

export function FilterSection({ title, layout = "wrap", children }: FilterSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">{title}</h3>
      <div
        className={cn(
          "gap-2",
          layout === "grid" ? "grid grid-cols-2 sm:grid-cols-3" : "flex flex-wrap"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterDrawerShell
// ---------------------------------------------------------------------------

interface FilterDrawerShellProps {
  /** Drawer title shown in the header */
  title: string;
  /** Accessible description (sr-only) */
  description: string;
  /** Number of currently active filters — drives trigger badge and Reset visibility */
  activeCount: number;
  /** Called when user taps "Terapkan Filter" */
  onApply: () => void;
  /** Called when user taps "Reset" */
  onReset: () => void;
  /** Called when drawer opens — use to sync store→local state */
  onOpen?: () => void;
  /** Override the apply button label. Defaults to "Terapkan Filter" */
  applyLabel?: string;
  /** Override the default trigger button. When provided, `activeCount` badge is consumer's responsibility. */
  trigger?: React.ReactNode;
  /** Filter section content */
  children: React.ReactNode;
}

export function FilterDrawerShell({
  title,
  description,
  activeCount,
  onApply,
  onReset,
  onOpen,
  applyLabel = "Terapkan Filter",
  trigger,
  children,
}: FilterDrawerShellProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) onOpen?.();
  };

  const handleApply = () => {
    onApply();
    setIsOpen(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Trigger asChild>
        {trigger || (
          <Button
            variant={activeCount > 0 ? "accent" : "outline"}
            className={cn(
              "rounded-full font-bold px-5 h-[44px] gap-1.5 transition-all duration-300",
              activeCount > 0
                ? "shadow-md"
                : "bg-surface-glass backdrop-blur-md text-text-primary hover:bg-surface-glass hover:text-text-primary shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            )}
          >
            <Funnel size={16} weight={activeCount > 0 ? "fill" : "bold"} />
            Filter {activeCount > 0 && `(${activeCount})`}
          </Button>
        )}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-surface-base flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none max-h-[90vh] shadow-heavy">
          <div
            className="p-4 bg-surface-base rounded-t-[32px] flex-1 overflow-y-auto [scrollbar-width:none] touch-manipulation relative z-0"
            style={{ WebkitOverflowScrolling: "touch", transform: "translate3d(0,0,0)" }}
            data-vaul-no-drag
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border-strong mb-6" />

            <div className="flex items-center justify-between mb-6 px-2">
              <Drawer.Title className="text-xl font-bold">{title}</Drawer.Title>
              <Drawer.Description className="sr-only">{description}</Drawer.Description>
              {activeCount > 0 && (
                <button
                  onClick={onReset}
                  className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-8 px-2 pb-24">
              {children}
            </div>
          </div>

          <div
            className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-surface-base border-t border-border-subtle shrink-0 relative z-10"
            style={{ transform: "translate3d(0,0,0)" }}
          >
            <Button
              onClick={handleApply}
              className="w-full h-14 rounded-2xl text-[15px] font-bold bg-text-primary text-surface-base hover:bg-text-primary/90 active:scale-[0.98] transition-transform duration-200"
            >
              {applyLabel}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
