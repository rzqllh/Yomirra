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
import { useSourceHealthStore, type SourceHealth } from "@/shared/store/source-health-store";
import { useHistoryStore } from "@/shared/store/history-store";

type ObservedSourceHealth = Pick<SourceHealth, "status" | "lastSuccessAt" | "lastErrorAt">;

function getObservedHealthRank(health: ObservedSourceHealth | undefined, now: number): number {
  const checkedAt = Math.max(health?.lastSuccessAt ?? 0, health?.lastErrorAt ?? 0);
  if (!checkedAt || now - checkedAt > 5 * 60 * 1000) return 3; // No recent evidence
  switch (health?.status) {
    case "online": return 0;
    case "slow": return 1;
    case "degraded": return 2;
    case "offline": return 4;
    default: return 3;
  }
}

/** A last-used source is pinned only when it has recent successful-request evidence. */
export function prioritizeCanonicalBindings(
  bindings: SourceBinding[],
  lastUsedSourceId: string | null,
  healthBySource: Record<string, ObservedSourceHealth>,
  now = Date.now()
): SourceBinding[] {
  return [...bindings].sort((a, b) => {
    const aRank = getObservedHealthRank(healthBySource[a.sourceId], now);
    const bRank = getObservedHealthRank(healthBySource[b.sourceId], now);
    const aPinned = a.sourceId === lastUsedSourceId && aRank === 0;
    const bPinned = b.sourceId === lastUsedSourceId && bRank === 0;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return aRank - bRank;
  });
}

function getObservedHealthLabel(health: ObservedSourceHealth | undefined, now: number): string {
  const rank = getObservedHealthRank(health, now);
  if (rank === 0) return "Respons terakhir berhasil";
  if (rank === 1) return "Respons lambat";
  if (rank === 2) return "Sebagian request gagal";
  if (rank === 4) return "Sedang bermasalah";
  return "Belum diperiksa";
}

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
  const healthBySource = useSourceHealthStore((state) => state.healthBySource);
  const historyItems = useHistoryStore((state) => state.items);
  const availableBindings = React.useMemo(
    () => sourceBindings.filter((binding) => isCanonicalBindingAvailable(binding, disabledSources)),
    [sourceBindings, disabledSources]
  );
  const lastUsedSourceId = React.useMemo(() => {
    const refs = new Set(availableBindings.map((binding) => JSON.stringify([binding.sourceId, binding.mangaId])));
    let latest = 0;
    let sourceId: string | null = null;
    for (const item of Object.values(historyItems)) {
      if (item.readAt > latest && refs.has(JSON.stringify([item.sourceId, item.mangaId]))) {
        latest = item.readAt;
        sourceId = item.sourceId;
      }
    }
    return sourceId;
  }, [availableBindings, historyItems]);
  const sortedBindings = React.useMemo(
    () => prioritizeCanonicalBindings(availableBindings, lastUsedSourceId, healthBySource),
    [availableBindings, lastUsedSourceId, healthBySource]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass size={20} weight="regular" className="text-accent" />
            Pilih sumber
          </DialogTitle>
          <DialogDescription>
            {title} tercatat di {availableBindings.length} sumber. Pilih sumber untuk membuka detail.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {sortedBindings.map((binding) => {
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
                    {[binding.language, binding.latestChapter, getObservedHealthLabel(healthBySource[binding.sourceId], Date.now())].filter(Boolean).join(" · ")}
                  </p>
                  {binding.sourceId === lastUsedSourceId && (
                    <p className="mt-0.5 text-xs text-text-muted">Terakhir dibaca</p>
                  )}
                </div>
                <ArrowRight size={16} weight="regular" className="shrink-0 text-text-muted" />
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
