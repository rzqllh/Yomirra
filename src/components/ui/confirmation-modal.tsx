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
import { Trash, Warning, Info } from "@phosphor-icons/react";
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
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isBusy = isLoading || internalLoading;

  const defaultIcon = React.useMemo(() => {
    if (icon) return icon;
    switch (variant) {
      case "danger":
        return <Trash size={22} weight="duotone" />;
      case "warning":
        return <Warning size={22} weight="duotone" />;
      case "info":
      default:
        return <Info size={22} weight="duotone" />;
    }
  }, [icon, variant]);

  const iconStyle = React.useMemo(() => {
    switch (variant) {
      case "danger":
        return "bg-gradient-to-br from-semantic-error/20 via-semantic-error/10 to-transparent border-semantic-error/30 text-semantic-error";
      case "warning":
        return "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/30 text-amber-500";
      case "info":
      default:
        return "bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border-accent/30 text-accent";
    }
  }, [variant]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isBusy && onOpenChange(open)}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader className="gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs select-none shrink-0",
              iconStyle
            )}
            aria-hidden="true"
          >
            {defaultIcon}
          </div>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-1.5">{description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex-row gap-2.5 sm:justify-end mt-2">
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
            disabled={isBusy}
            className="flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold shadow-xs active:scale-95 transition-all"
          >
            {isBusy ? "Memproses..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
