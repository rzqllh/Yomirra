"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
      <h3 className="text-[12px] font-bold text-text-muted uppercase tracking-[0.12em] mb-2.5">{title}</h3>
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
  desktopPortalId?: string;
  /** Filter section content */
  children: React.ReactNode;
}

import { motion, useReducedMotion } from "motion/react";

export function FilterDrawerShell({
  title,
  description,
  activeCount,
  onApply,
  onReset,
  onOpen,
  applyLabel = "Terapkan Filter",
  trigger,
  desktopPortalId,
  children,
}: FilterDrawerShellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [desktopTarget, setDesktopTarget] = React.useState<HTMLElement | null>(null);
  const headingId = React.useId();
  React.useEffect(() => {
    if (!desktopPortalId || !window.matchMedia) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setDesktopTarget(media.matches ? document.getElementById(desktopPortalId) : null);
      setIsOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [desktopPortalId]);
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<number | string | null>(0.52);
  const touchStartY = React.useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const [visualViewportHeight, setVisualViewportHeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateHeight = () => {
      setVisualViewportHeight(Math.round(viewport.height));
    };

    updateHeight();
    viewport.addEventListener("resize", updateHeight);
    return () => viewport.removeEventListener("resize", updateHeight);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setActiveSnapPoint(0.52);
      onOpen?.();
    }
  };

  const expandDrawer = React.useCallback(() => {
    if (activeSnapPoint !== 0.92) setActiveSnapPoint(0.92);
  }, [activeSnapPoint]);

  const handleApply = () => {
    onApply();
    if (!desktopTarget) setIsOpen(false);
  };

  if (desktopTarget) {
    const triggerProps = {
      "aria-expanded": isOpen,
      "aria-controls": desktopPortalId,
      onClick: () => handleOpenChange(!isOpen),
    };
    const desktopTrigger = React.isValidElement(trigger)
      ? React.cloneElement(trigger as React.ReactElement<typeof triggerProps>, triggerProps)
      : <Button variant="outline" {...triggerProps}><Funnel size={18} weight="regular" />Filter {activeCount > 0 ? `(${activeCount})` : ""}</Button>;
    return <>{desktopTrigger}{isOpen && createPortal(
      <section aria-labelledby={headingId} className="mb-5 rounded-xl border border-border-subtle bg-surface-base p-4 xl:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-sm font-semibold text-text-primary">{title}</h2>
          <Button variant="ghost" onClick={onReset}>Reset filter</Button>
        </div>
        <div tabIndex={0} aria-label="Pilihan filter" className="grid max-h-[min(42dvh,380px)] grid-cols-2 gap-x-6 gap-y-5 overflow-y-auto pr-1 xl:grid-cols-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2 border-t border-border-subtle pt-3">
          <Button variant="ghost" onClick={() => { onOpen?.(); setIsOpen(false); }}>Batal</Button>
          <Button onClick={handleApply}>{applyLabel}</Button>
        </div>
      </section>, desktopTarget)}</>;
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      snapPoints={[0.52, 0.92]}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      fadeFromIndex={1}
      snapToSequentialPoint
    >
      <Drawer.Trigger asChild>
        {trigger || (
          <Button
            variant={activeCount > 0 ? "accent" : "outline"}
            className={cn(
              "relative rounded-full font-bold px-4 h-[44px] gap-1.5 motion-safe:transition-[background-color,color,border-color,box-shadow,transform] motion-safe:duration-300 border-border-subtle",
              activeCount > 0 ? "border-accent/40 bg-accent text-accent-on shadow-xs" : "bg-surface-glass backdrop-blur-md"
            )}
            aria-label={`Filter${activeCount > 0 ? ` (${activeCount} aktif)` : ""}`}
          >
            <Funnel size={18} weight={activeCount > 0 ? "fill" : "regular"} />
            <span>Filter</span>
            {activeCount > 0 && (
              <motion.span
                key={activeCount}
                initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: "easeOut" }}
                className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent-on text-accent text-[11px] font-black shadow-xs"
              >
                {activeCount}
              </motion.span>
            )}
          </Button>
        )}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[var(--z-drawer)]" />
        <Drawer.Content
          className="bg-surface-base flex h-[92dvh] max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] fixed bottom-0 left-0 right-0 z-[var(--z-overlay)] outline-none shadow-heavy border-t border-border-subtle"
          style={visualViewportHeight ? { maxHeight: `${visualViewportHeight}px` } : undefined}
        >
          <div className="pt-2.5 pb-2 px-5 sm:px-6 shrink-0 flex flex-col cursor-grab active:cursor-grabbing select-none">
            <div className="mx-auto w-11 h-1 shrink-0 rounded-full bg-border-strong/80 mb-3.5" />

            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-bold text-text-primary tracking-tight">{title}</Drawer.Title>
              <Drawer.Description className="sr-only">{description}</Drawer.Description>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className="min-h-11 px-3 text-sm font-semibold text-accent hover:text-accent-hover motion-safe:transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div
            className="px-5 sm:px-6 py-3.5 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] touch-pan-y relative z-0"
            style={{ WebkitOverflowScrolling: "touch" }}
            onWheelCapture={(event) => {
              if (event.deltaY > 6) expandDrawer();
            }}
            onScrollCapture={(event) => {
              if (event.currentTarget.scrollTop > 0) expandDrawer();
            }}
            onTouchStart={(event) => {
              touchStartY.current = event.touches[0]?.clientY ?? null;
            }}
            onTouchMove={(event) => {
              const start = touchStartY.current;
              const current = event.touches[0]?.clientY;
              if (start != null && current != null && start - current > 14) expandDrawer();
            }}
            onTouchEnd={() => {
              touchStartY.current = null;
            }}
          >
            <div className="space-y-5 pb-6">
              {children}
            </div>
          </div>

          <div
            className="px-4 pt-3 bg-surface-base/96 backdrop-blur-xl border-t border-border-subtle shrink-0 relative z-10"
            style={{ paddingBottom: "calc(1rem + var(--safe-bottom))" }}
          >
            <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="min-h-11">Batal</Button>
            <Button
              variant="primary"
              onClick={handleApply}
              className="w-full h-12 rounded-full text-[15px] font-bold"
            >
              {applyLabel}
            </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
