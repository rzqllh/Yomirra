"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WarningCircle, ArrowUpRight } from "@phosphor-icons/react";
import { EditorialCard } from "@/components/komik/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterChip } from "@/components/ui/filter-chip";
import { ChipRail } from "@/components/ui/chip-rail";
import { EmptyState } from "@/components/states/empty-state";
import {
  aggregatePopularFeeds,
  type PopularSourceFeed,
} from "@/shared/lib/popular-ranking";

import type { MalPopularFeed } from "@/shared/types/mal";
import { useLibraryStore } from "@/shared/store/library-store";
import { groupVerifiedCatalogEntries } from "@/shared/lib/canonical-identity";
import { indexDiscoveryCatalog } from "@/shared/lib/reviewed-catalog";
import { MalPopularSection } from "./mal-popular-section";

export interface PopularPageViewProps {
  mal?: MalPopularFeed;
  feeds: PopularSourceFeed[];
}

export function PopularPageView({ feeds, mal }: PopularPageViewProps) {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("tab") === "mal" ? "mal" : "local";
  const localTabRef = React.useRef<HTMLButtonElement>(null);
  const selectedSourceId = searchParams?.get("source") ?? "all";

  const setUrlParam = (name: string, value?: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  };
  const setMode = (value: string) => setUrlParam("tab", value === "mal" ? value : undefined);
  const setSelectedSourceId = (value: string) => setUrlParam("source", value === "all" ? undefined : value);

  const saved = useLibraryStore(state => state.items);
  const verifiedIndex = React.useMemo(() => indexDiscoveryCatalog(groupVerifiedCatalogEntries(Object.values(saved).filter(item => item.isBookmarked !== false))), [saved]);
  const aggregated = React.useMemo(() => aggregatePopularFeeds(feeds, verifiedIndex), [feeds, verifiedIndex]);
  const selectedFeed = React.useMemo(() => {
    if (selectedSourceId === "all") return null;
    return feeds.find((feed) => feed.sourceId === selectedSourceId) ?? null;
  }, [feeds, selectedSourceId]);

  if (feeds.length === 0 && !mal) {
    return (
      <div className="py-20">
        <EmptyState
          title="Belum ada sumber aktif"
          description="Aktifkan setidaknya satu sumber bacaan di menu Sumber untuk melihat peringkat populer."
        />
      </div>
    );
  }

  const heading = selectedFeed ? `Populer di ${selectedFeed.sourceName}` : "Peringkat lintas sumber";

  const ranking = selectedFeed
    ? selectedFeed.mangas.map((manga) => ({ manga, sourceId: selectedFeed.sourceId, sourceBindings: undefined }))
    : aggregated;
  const emptyTitle = selectedFeed
    ? selectedFeed.loadFailed
      ? `Peringkat dari ${selectedFeed.sourceName} belum bisa dimuat.`
      : `Belum ada data populer dari ${selectedFeed.sourceName}.`
    : "Peringkat belum bisa dimuat";

  return (
    <Tabs value={mode} onValueChange={(value) => setMode(value as "local" | "mal")} className="space-y-4">
      <TabsList aria-label="Peringkat populer" className="grid h-auto w-full grid-cols-2 rounded-xl sm:inline-grid sm:w-auto">
        <TabsTrigger value="local" ref={localTabRef} className="min-h-11 whitespace-normal">Populer di Yomirra</TabsTrigger>
        <TabsTrigger value="mal" className="min-h-11 whitespace-normal">Tren MyAnimeList</TabsTrigger>
      </TabsList>

      <TabsContent value="mal">
        <MalPopularSection feed={mal} onSwitchToLocal={() => {
          setMode("local");
          localTabRef.current?.focus();
        }} />
      </TabsContent>
      <TabsContent value="local">
        <section aria-labelledby="popular-local-heading" className="space-y-4">
          <div>
            <h2 id="popular-local-heading" className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              {heading}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {selectedFeed
                ? `Peringkat komik paling ramai dibaca di ${selectedFeed.sourceName}.`
                : "Komik dari beberapa sumber digabung hanya jika identitas karyanya terverifikasi."}
            </p>
          </div>
          {feeds.length > 0 && (
            <ChipRail bleed={false} className="px-1 pt-1" role="group" aria-label="Filter sumber komik">
              <FilterChip
                label={`Semua Sumber (${aggregated.length})`}
                selected={selectedSourceId === "all"}
                onClick={() => setSelectedSourceId("all")}
                variant={selectedSourceId === "all" ? "accent-subtle" : "default"}
              />
              {feeds.map((feed) => (
                <FilterChip
                  key={feed.sourceId}
                  label={
                    feed.loadFailed ? (
                      <>
                        {feed.sourceName}
                        <span className="text-2xs text-status-error-fg">Gagal dimuat</span>
                      </>
                    ) : `${feed.sourceName}${feed.mangas.length > 0 ? ` (${feed.mangas.length})` : ""}`
                  }
                  selected={selectedSourceId === feed.sourceId}
                  aria-label={feed.loadFailed ? `${feed.sourceName}, gagal dimuat` : undefined}
                  onClick={() => setSelectedSourceId(feed.sourceId)}
                  variant={selectedSourceId === feed.sourceId ? "accent-subtle" : "default"}
                />
              ))}
            </ChipRail>
          )}

          {selectedFeed && !selectedFeed.loadFailed && selectedFeed.mangas.length > 0 && (
            <Link
              href={`/sources/${selectedFeed.sourceId}?sort=popular`}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
            >
              Katalog lengkap
              <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          )}

          {ranking.length > 0 ? (
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {ranking.slice(0, 36).map(({ manga, sourceId, sourceBindings }, index) => (
                <EditorialCard
                  key={`${sourceId}::${manga.id}`}
                  manga={manga}
                  rank={index + 1}
                  sourceId={sourceId}
                  sourceBindings={sourceBindings}
                  priority={index < 4}
                  index={index}
                  animateReveal
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<WarningCircle size={40} weight="duotone" />}
              title={emptyTitle}
              description="Coba muat ulang atau pilih sumber lain."
            />
          )}
        </section>
      </TabsContent>
    </Tabs>
  );
}
