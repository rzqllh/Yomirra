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
import { isContentVisible, isSourceContentVisible } from "@/shared/sources/content-policy";
import { useSettingsStore } from "@/shared/store/settings-store";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSourceHealthStore, type SourceHealth } from "@/shared/store/source-health-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { rankQualityRefs, type QualitySort } from "@/shared/lib/source-quality";
import { SourceQualitySort } from "./source-quality-sort";
import { useSourceQualityStore } from "@/shared/store/source-quality-store";
import { useSharedChapterEvidence } from "@/shared/hooks/use-shared-chapter-evidence";


type ObservedSourceHealth = Pick<SourceHealth, "status" | "lastSuccessAt" | "lastErrorAt">;

function getObservedHealthRank(health: ObservedSourceHealth | undefined, now: number): number {
  const checkedAt = Math.max(health?.lastSuccessAt ?? 0, health?.lastErrorAt ?? 0);
  if (!Number.isFinite(checkedAt) || checkedAt <= 0 || checkedAt > now || now - checkedAt > 5 * 60 * 1000) return 3; // No recent evidence
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
  if (!binding.sourceId?.trim() || !binding.mangaId?.trim() || !source || disabledSources.includes(binding.sourceId)) return false;
  return (
    source.isEnabled !== false &&
    source.isInstalled === true &&
    source.capabilities?.detail === true &&
    !source.maintenance &&
    source.status !== "in-fix" &&
    source.status !== "in-dev"
  );
}

/** Count eligible distinct providers, never raw rows. Conflicting provider
 * editions cannot silently choose a chapter or title for the reader. */
export function eligibleCanonicalBindings(
  bindings: readonly SourceBinding[],
  disabledSources: string[] = [],
  hideNsfw = true,
): SourceBinding[] {
  const byProvider = new Map<string, SourceBinding>();
  const conflicts = new Set<string>();
  for (const binding of bindings) {
    const source = getSourceMetadata(binding.sourceId);
    if (!source || !isCanonicalBindingAvailable(binding, disabledSources) ||
        !isSourceContentVisible(source, hideNsfw) || !isContentVisible(binding, hideNsfw)) continue;
    const previous = byProvider.get(binding.sourceId);
    if (previous && previous.mangaId !== binding.mangaId) conflicts.add(binding.sourceId);
    else if (!previous) byProvider.set(binding.sourceId, binding);
  }
  return [...byProvider.values()].filter(binding => !conflicts.has(binding.sourceId));
}

export function CanonicalSourceDialog({
  open,
  onOpenChange,
  title,
  sourceBindings,
  returnTo,
}: CanonicalSourceDialogProps) {
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const healthBySource = useSourceHealthStore((state) => state.healthBySource);
  const historyItems = useHistoryStore((state) => state.items);
  const qualityEvidence=useSourceQualityStore(state=>state.evidence);
  const shared=useSourceQualityStore(state=>state.shared);
  const [qualitySort,setQualitySort]=React.useState<QualitySort>("quality");
  const preferences=useSettingsStore(state=>state.perTitleSourcePreferences);
  const languages=useSettingsStore(state=>state.preferredLanguages);
  const availableBindings = React.useMemo(
    () => eligibleCanonicalBindings(sourceBindings, disabledSources, hideNsfw),
    [sourceBindings, disabledSources, hideNsfw]
  );
  const sharedChapters=useSharedChapterEvidence(availableBindings,open&&hideNsfw);
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

  const choices=new Set(availableBindings.map(b=>preferences[b.sourceId+"::"+b.mangaId]).filter(Boolean));
  const preferred=choices.size===1?[...choices][0]:undefined;
  const ranked=rankQualityRefs(sortedBindings,qualityEvidence,{preferred,languages,shared,sharedChapters,sort:qualitySort});

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

        <SourceQualitySort value={qualitySort} onChange={setQualitySort}/>
        <div className="flex flex-col gap-2">
          {sortedBindings.length === 0 && <p role="status" className="text-sm text-text-secondary">Belum ada sumber yang dapat dibuka. Periksa pilihan sumber atau cari judul lainnya.</p>}
          {ranked.map(({ref:binding,quality,scope}) => {
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
                  <p className="mt-0.5 text-xs text-text-muted">{quality.score===null?"SQS: Belum cukup data":`SQS ${quality.score}/100 · bukti ${quality.coverage}% · ${scope==="title"?"judul":scope==="monitor"?"monitor":"perangkat"}`}</p>
                  {binding.sourceId === preferred && <p className="mt-0.5 text-xs text-text-muted">Sumber utama</p>}
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
