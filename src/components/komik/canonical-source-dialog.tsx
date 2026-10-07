"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SourceBinding } from "@/shared/lib/canonical-search";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";

interface CanonicalSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sourceBindings: SourceBinding[];
  returnTo?: string;
}

export function isCanonicalBindingAvailable(binding: SourceBinding, disabledSources: string[] = []) {
  const source = getSourceMetadata(binding.sourceId);
  if (!source || disabledSources.includes(binding.sourceId)) return false;
  return (
    source.isEnabled !== false &&
    source.isInstalled !== false &&
    source.status !== "unavailable" &&
    source.status !== "in-fix"
  );
}

export function CanonicalSourceDialog({
  open,
  onOpenChange,
  title,
  sourceBindings,
  returnTo,
}: CanonicalSourceDialogProps) {
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources);
  const availableBindings = React.useMemo(
    () => sourceBindings.filter((binding) => isCanonicalBindingAvailable(binding, disabledSources)),
    [sourceBindings, disabledSources]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass size={20} weight="duotone" className="text-accent" />
            Pilih sumber
          </DialogTitle>
          <DialogDescription>
            {title} tersedia di {availableBindings.length} sumber aktif.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {availableBindings.map((binding) => {
            const source = getSourceMetadata(binding.sourceId);
            return (
              <Link
                key={`${binding.sourceId}::${binding.mangaId}`}
                href={getMangaDetailHref(binding.sourceId, binding.mangaId, returnTo)}
                onClick={() => onOpenChange(false)}
                className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-raised px-4 py-3 text-left transition-colors hover:border-border-default hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {source?.name ?? binding.sourceId}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {[binding.language, binding.latestChapter].filter(Boolean).join(" · ") || "Buka dari sumber ini"}
                  </p>
                </div>
                <ArrowRight size={16} weight="bold" className="shrink-0 text-text-muted" />
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
