"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash, Warning, Info, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "default";
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  /**
   * When set, renders an explicit checkbox the user must tick before
   * the confirm button becomes active. Use for high-stakes destructive
   * actions with cascading side-effects (e.g. clearing all local data).
   */
  requireCheckbox?: string;
}

export function ConfirmationModal({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  icon,
  onConfirm,
  isLoading = false,
  requireCheckbox,
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  // Reset checkbox each time modal opens
  React.useEffect(() => {
    if (isOpen) setChecked(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isBusy = isLoading || internalLoading;
  const isConfirmBlocked = !!requireCheckbox && !checked;

  const defaultIcon = React.useMemo(() => {
    if (icon) return icon;
    switch (variant) {
      case "danger":
        return <Trash size={28} weight="duotone" />;
      case "warning":
        return <Warning size={28} weight="duotone" />;
      case "info":
      default:
        return <Info size={28} weight="duotone" />;
    }
  }, [icon, variant]);

  const iconContainerStyle = React.useMemo(() => {
    switch (variant) {
      case "danger":
        return "bg-gradient-to-br from-semantic-error/20 via-semantic-error/10 to-transparent border-semantic-error/25 text-semantic-error shadow-[0_0_24px_rgba(255,69,58,0.12)]";
      case "warning":
        return "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/25 text-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.12)]";
      case "info":
      default:
        return "bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border-accent/25 text-accent shadow-[0_0_24px_rgba(108,106,250,0.12)]";
    }
  }, [variant]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isBusy && onOpenChange(open)}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Icon + text — centered focal hierarchy */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-[20px] border shrink-0 select-none",
              iconContainerStyle
            )}
            aria-hidden="true"
          >
            {defaultIcon}
          </div>

          <div className="flex flex-col gap-1.5 items-center">
            <DialogHeader className="gap-0 text-center items-center">
              <DialogTitle className="text-base font-bold leading-snug">
                {title}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-sm text-text-muted leading-relaxed">
              {description}
            </DialogDescription>
          </div>

          {/* Explicit acknowledgement checkbox for high-stakes actions */}
          {requireCheckbox && (
            <label
              className={cn(
                "flex items-start gap-2.5 w-full mt-1 cursor-pointer p-3 rounded-2xl border transition-all select-none text-left",
                checked
                  ? "bg-semantic-error/[0.06] border-semantic-error/30"
                  : "bg-surface-base border-border-subtle hover:border-border-default"
              )}
            >
              <div className="relative mt-[1px] shrink-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="peer sr-only"
                  id="confirmation-checkbox"
                />
                <div
                  className={cn(
                    "h-4 w-4 rounded-[5px] border-2 flex items-center justify-center transition-all",
                    checked
                      ? "bg-semantic-error border-semantic-error"
                      : "bg-surface-base border-border-default peer-focus-visible:ring-2 peer-focus-visible:ring-semantic-error/30"
                  )}
                >
                  {checked && <CheckCircle size={12} weight="bold" className="text-white" />}
                </div>
              </div>
              <span className="text-xs text-text-muted leading-relaxed">
                {requireCheckbox}
              </span>
            </label>
          )}
        </div>

        {/* Divider + action row */}
        <div className="border-t border-border-subtle/50 px-6 py-4">
          <DialogFooter className="flex-row gap-2.5 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
              className="flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold border border-border-default/40 hover:bg-surface-hover"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === "danger" ? "destructive" : "accent"}
              onClick={handleConfirm}
              disabled={isBusy || isConfirmBlocked}
              className={cn(
                "flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold shadow-xs active:scale-95 transition-all",
                isConfirmBlocked && "opacity-40 cursor-not-allowed active:scale-100"
              )}
            >
              {isBusy ? "Memproses..." : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

