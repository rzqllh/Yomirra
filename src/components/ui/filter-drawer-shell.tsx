"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Funnel } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

// FilterSection


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

// FilterDrawerShell


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
              "rounded-2xl font-bold px-4 h-[44px] gap-1.5 transition-all duration-300 border-border-subtle",
              activeCount > 0 ? "border-accent/30" : "bg-surface-glass backdrop-blur-md"
            )}
          >
            <Funnel size={18} weight={activeCount > 0 ? "fill" : "bold"} />
            <span>Filter</span>
            {activeCount > 0 && <span className="ml-0.5">{activeCount}</span>}
          </Button>
        )}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-surface-base flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-[100] outline-none max-h-[85vh] min-h-[220px] shadow-heavy border-t border-border-subtle">
          {/* 1. Sheet Chrome (Drag Handle + Header / Title) - Non-scrolling & Draggable */}
          <div className="pt-3 pb-2 px-6 shrink-0 flex flex-col cursor-grab active:cursor-grabbing select-none">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-border-strong mb-4" />

            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-bold text-text-primary tracking-tight">{title}</Drawer.Title>
              <Drawer.Description className="sr-only">{description}</Drawer.Description>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors px-1 py-0.5"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 2. Scrollable Content Body */}
          <div
            className="px-6 py-4 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] touch-manipulation relative z-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="space-y-6 pb-6">
              {children}
            </div>
          </div>

          {/* 3. Sticky Footer */}
          <div
            className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-surface-base border-t border-border-subtle shrink-0 relative z-10"
          >
            <Button
              variant="primary"
              onClick={handleApply}
              className="w-full h-12 rounded-2xl text-[15px] font-bold"
            >
              {applyLabel}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
