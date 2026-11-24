"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Compass, MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { HistoryCard } from "@/components/komik/card/history-card";
import { getLibraryHref, getSearchHref, getCanonicalSavedDetailHref, getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { resolveCanonicalResume } from "@/shared/lib/canonical-resume";
import { canonicalSourceKey } from "@/shared/lib/canonical-identity";
import { getRelativeTime } from "@/shared/utils/date";

export { getRelativeTime };

export interface ReadingTabProps {
  groupedHistory: Array<{
    sourceId: string;
    mangaId: string;
    mangaTitle: string;
    coverUrl?: string;
    sourceName?: string;
    latestReadAt: number;
    chapters: Array<any>;
    preferenceKey?: string;
    preferenceAliases?: string[];
  }>;
  pendingDeletions: Set<string>;
  onRemoveHistory: (sourceId: string, mangaId: string, mangaTitle: string) => void;
}

export function ReadingTab({
  groupedHistory,
  pendingDeletions,
  onRemoveHistory,
}: ReadingTabProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const perTitlePrefs = useSettingsStore(state => state.perTitleSourcePreferences);
  const disabledSources = useSourcePreferencesStore(state => state.disabledSources);
  const [deviceOffline, setDeviceOffline] = React.useState(false);
  React.useEffect(() => {
    const check = () => setDeviceOffline(navigator.onLine === false);
    check();
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, []);

  const visibleHistory = React.useMemo(
    () =>
      groupedHistory.filter(
        (g) => !pendingDeletions.has(`${g.sourceId}::${g.mangaId}`)
      ),
    [groupedHistory, pendingDeletions]
  );

  const filteredHistory = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleHistory;
    return visibleHistory.filter((g) =>
      g.mangaTitle.toLowerCase().includes(q)
    );
  }, [visibleHistory, searchQuery]);

  if (visibleHistory.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
        title="Belum ada bacaan"
        description="Komik yang kamu mulai baca akan muncul di sini."
        action={
          <Button asChild variant="accent" className="rounded-xl shadow-sm font-bold mt-4">
            <Link href={getLibraryHref()}>
              <Compass size={20} weight="regular" className="mr-1.5" />
              Cari bacaan
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-reading"
      aria-labelledby="tab-reading"
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          placeholder="Cari bacaan aktif…"
          aria-label="Cari bacaan aktif di riwayat"
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-text-muted tracking-wide">
          {searchQuery.trim()
            ? `${filteredHistory.length} dari ${visibleHistory.length} bacaan`
            : `${visibleHistory.length} bacaan aktif`}
        </span>
        <span className="text-xs text-text-muted">Terakhir dibaca</span>
      </div>

      {filteredHistory.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={48} className="text-text-muted" weight="duotone" />}
          title="Bacaan tidak ditemukan"
          description={`Tidak ada bacaan aktif yang cocok dengan kata kunci "${searchQuery}".`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setSearchQuery("")}
                className="rounded-xl shadow-sm font-semibold"
              >
                Hapus pencarian
              </Button>
              <Button asChild variant="accent" className="rounded-xl shadow-sm font-bold">
                <Link href={getSearchHref(searchQuery)}>
                  <MagnifyingGlass size={18} weight="bold" className="mr-1.5" />
                  Cari di seluruh katalog
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHistory.map((group) => {
            const chapter = group.chapters[0] || {};
            const item = {
              ...chapter,
              sourceId: chapter.sourceId || group.sourceId,
              mangaId: chapter.mangaId || group.mangaId,
              mangaTitle: chapter.mangaTitle || group.mangaTitle,
              coverUrl: chapter.coverUrl || group.coverUrl,
            };
            // Use the verified saved-title identity when available. A source pair
            // is only a fallback for history-only works with no saved identity.
            const canonicalHref = getCanonicalSavedDetailHref(
              group.preferenceKey ?? `${item.sourceId}::${item.mangaId}`
            );
            // Older single-provider history records inherit the group identity.
            // A mixed group without chapter provenance must never guess a cursor.
            const explicitRefs = new Set(group.chapters.filter(ch => ch.sourceId && ch.mangaId)
              .map(ch => canonicalSourceKey(ch.sourceId, ch.mangaId)));
            const groupRef = canonicalSourceKey(group.sourceId, group.mangaId);
            const singleProvider = !group.preferenceKey &&
              (group.preferenceAliases?.length ?? 0) <= 1 &&
              [...explicitRefs].every(ref => ref === groupRef);
            const positions = group.chapters.flatMap(ch => {
              const sourceId = ch.sourceId && ch.mangaId ? ch.sourceId : singleProvider && !ch.sourceId && !ch.mangaId ? group.sourceId : undefined;
              const mangaId = ch.sourceId && ch.mangaId ? ch.mangaId : singleProvider && !ch.sourceId && !ch.mangaId ? group.mangaId : undefined;
              return sourceId && mangaId ? [{ sourceId: String(sourceId), mangaId: String(mangaId), chapterId: String(ch.chapterId ?? ""), readAt: Number(ch.readAt) || 0 }] : [];
            });
            const bindings = Array.from(new Map(positions.map(ch => [
              canonicalSourceKey(ch.sourceId, ch.mangaId),
              { sourceId: ch.sourceId, mangaId: ch.mangaId },
            ])).values());
            const aliases = group.preferenceAliases ?? positions.map(ch => `${ch.sourceId}::${ch.mangaId}`);
            const observed = aliases.map(key => perTitlePrefs[key]).filter(Boolean);
            const preferredSourceId = group.preferenceKey ? perTitlePrefs[group.preferenceKey]
              ?? observed[0] : observed[0];
            const hasPreferenceConflict = !(
              group.preferenceKey && perTitlePrefs[group.preferenceKey]
            ) && new Set(observed).size > 1;
            const staleSources = bindings.filter(ref => {
              const source = dynamicSourceRegistry.get(ref.sourceId) ?? getSourceMetadata(ref.sourceId);
              return !source || source.isEnabled === false || source.isInstalled === false ||
                Boolean(source.maintenance) || source.status === "in-dev" || source.status === "in-fix";
            }).map(ref => ref.sourceId);
            const decision = hasPreferenceConflict
              ? { action: "pick-source" as const, reason: "preference-conflict" as const }
              : resolveCanonicalResume({
              bindings,
              preferredSourceId,
              disabledSourceIds: disabledSources,
              unavailableSourceIds: staleSources,
              deviceOffline,
              lastRead: positions.filter(ch => ch.chapterId),
            });
            // Fail closed to canonical detail/picker if source cannot be chosen
            // safely (offline, unavailable, multiple candidates, conflicts).
            const resumeHref = decision.action === "resume"
              ? decision.chapterId
                ? getReaderHref(decision.source.sourceId, decision.source.mangaId, decision.chapterId, "/library")
                : getMangaDetailHref(decision.source.sourceId, decision.source.mangaId, "/library")
              : canonicalHref;
            return (
              <HistoryCard
                key={`${group.sourceId}::${group.mangaId}`}
                item={item}
                canonicalDetailHref={canonicalHref}
                resumeHref={resumeHref}
                clarifyProgress
                className="bg-surface-raised border border-border-subtle hover:border-border-default shadow-xs w-full max-w-none snap-none"
                onDeleteOverride={(sourceId, mangaId, title) => onRemoveHistory(sourceId, mangaId, title)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
