"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Compass, MagnifyingGlass } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { HistoryCard } from "@/components/komik/card/history-card";
import { getLibraryHref, getSearchHref } from "@/shared/lib/routes";
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
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {searchQuery.trim()
            ? `${filteredHistory.length} dari ${visibleHistory.length} bacaan`
            : `${visibleHistory.length} bacaan aktif`}
        </span>
        <span className="text-2xs text-text-muted/60">Terakhir dibaca</span>
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
            return (
              <HistoryCard
                key={`${group.sourceId}::${group.mangaId}`}
                item={item}
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
