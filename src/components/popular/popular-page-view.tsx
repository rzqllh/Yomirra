"use client";

import * as React from "react";
import Link from "next/link";
import { WarningCircle, ArrowUpRight } from "@phosphor-icons/react";
import { EditorialCard } from "@/components/komik/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FilterChip } from "@/components/ui/filter-chip";
import { EmptyState } from "@/components/states/empty-state";
import {
  aggregatePopularFeeds,
  type PopularSourceFeed,
} from "@/shared/lib/popular-ranking";

import type { MalPopularFeed } from "@/shared/types/mal";
import { MalPopularSection } from "./mal-popular-section";

interface PopularPageViewProps {
  mal?: MalPopularFeed;
  feeds: PopularSourceFeed[];
}

export function PopularPageView({ feeds, mal }: PopularPageViewProps) {
  const [mode, setMode] = React.useState<"local" | "mal">("local");
  const [selectedSourceId, setSelectedSourceId] = React.useState<string>("all");

  const aggregated = React.useMemo(() => aggregatePopularFeeds(feeds), [feeds]);
  const successfulFeeds = React.useMemo(
    () => feeds.filter((feed) => !feed.loadFailed && feed.mangas.length > 0),
    [feeds]
  );

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

  const segmentOptions = [
    { value: "local", label: "Populer di Yomirra" },
    ...(mal ? [{ value: "mal", label: "Tren MyAnimeList" }] : []),
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Top Mode Segmented Control */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={mode}
          onChange={(value) => setMode(value as "local" | "mal")}
          options={segmentOptions}
          layoutId="popular-primary-mode"
          fullWidth
          className="sm:w-auto"
        />
        {mode === "local" && (
          <p className="text-xs leading-relaxed text-text-muted sm:max-w-md sm:text-right">
            Urutan gabungan menghitung posisi peringkat di setiap sumber aktif, bukan menyamakan metrik angka mentah.
          </p>
        )}
      </div>

      {mode === "mal" && mal ? (
        <MalPopularSection feed={mal} />
      ) : (
        <div className="space-y-6">
          {/* Source Filter Pills Rail */}
          {feeds.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <FilterChip
                label={`Semua Sumber (${aggregated.length})`}
                selected={selectedSourceId === "all"}
                onClick={() => setSelectedSourceId("all")}
                variant={selectedSourceId === "all" ? "accent-solid" : "default"}
              />
              {feeds.map((feed) => (
                <FilterChip
                  key={feed.sourceId}
                  label={`${feed.sourceName}${feed.mangas.length > 0 ? ` (${feed.mangas.length})` : ""}`}
                  selected={selectedSourceId === feed.sourceId}
                  showDownBadge={feed.loadFailed}
                  onClick={() => setSelectedSourceId(feed.sourceId)}
                  variant={selectedSourceId === feed.sourceId ? "accent-solid" : "default"}
                />
              ))}
            </div>
          )}

          {/* Aggregated (All Sources) View */}
          {selectedSourceId === "all" ? (
            aggregated.length > 0 ? (
              <section aria-labelledby="popular-combined-heading">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2
                      id="popular-combined-heading"
                      className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl"
                    >
                      Peringkat lintas sumber
                    </h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Menampilkan komik teratas yang mendominasi katalog sumber aktif.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs font-bold text-text-secondary">
                    {aggregated.length} judul
                  </span>
                </div>

                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {aggregated.slice(0, 36).map((item, index) => (
                    <EditorialCard
                      key={`${item.sourceId}::${item.manga.id}`}
                      manga={{ ...item.manga, rank: index + 1 }}
                      rank={index + 1}
                      sourceId={item.sourceId}
                      sourceBindings={item.sourceBindings}
                      priority={index < 4}
                      index={index}
                      animateReveal
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="py-16">
                <EmptyState
                  icon={<WarningCircle size={40} weight="duotone" />}
                  title="Peringkat belum bisa dimuat"
                  description="Sumber aktif belum memberikan data populer saat ini. Coba muat ulang atau periksa status sumber."
                />
              </div>
            )
          ) : selectedFeed ? (
            /* Single Selected Source View */
            <section aria-labelledby={`popular-${selectedFeed.sourceId}`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2
                    id={`popular-${selectedFeed.sourceId}`}
                    className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl"
                  >
                    Populer di {selectedFeed.sourceName}
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Peringkat komik paling ramai dibaca langsung dari server {selectedFeed.sourceName}.
                  </p>
                </div>
                {!selectedFeed.loadFailed && selectedFeed.mangas.length > 0 && (
                  <Link
                    href={`/sources/${selectedFeed.sourceId}?sort=popular`}
                    className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-bold text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span>Katalog lengkap</span>
                    <ArrowUpRight size={14} weight="bold" />
                  </Link>
                )}
              </div>

              {selectedFeed.mangas.length > 0 ? (
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {selectedFeed.mangas.slice(0, 36).map((manga, index) => (
                    <EditorialCard
                      key={manga.id}
                      manga={{ ...manga, rank: index + 1 }}
                      rank={index + 1}
                      sourceId={selectedFeed.sourceId}
                      priority={index < 4}
                      index={index}
                      animateReveal
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6 text-center sm:text-left">
                  <p className="text-sm font-bold text-text-primary">
                    {selectedFeed.loadFailed
                      ? `Peringkat dari ${selectedFeed.sourceName} belum bisa dimuat.`
                      : `Belum ada data populer dari ${selectedFeed.sourceName}.`}
                  </p>
                  <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                    Server sumber mungkin sedang dalam pemeliharaan atau pembatasan permintaan. Kamu dapat memilih sumber lain dari daftar di atas.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {/* Global Empty State if absolutely zero feeds have manga */}
          {successfulFeeds.length === 0 && aggregated.length === 0 && (
            <div className="py-12">
              <EmptyState
                icon={<WarningCircle size={40} weight="duotone" />}
                title="Semua sumber belum memberikan data peringkat"
                description="Katalog populer dari sumber aktif sedang tidak tersedia. Kamu tetap dapat mencari judul secara langsung melalui pencarian."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
