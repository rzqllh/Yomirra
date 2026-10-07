"use client";

import * as React from "react";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { EditorialCard } from "@/components/komik/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EmptyState } from "@/components/states/empty-state";
import {
  aggregatePopularFeeds,
  type PopularSourceFeed,
} from "@/shared/lib/popular-ranking";

interface PopularPageViewProps {
  feeds: PopularSourceFeed[];
}

export function PopularPageView({ feeds }: PopularPageViewProps) {
  const [mode, setMode] = React.useState<"combined" | "source">("combined");
  const aggregated = React.useMemo(() => aggregatePopularFeeds(feeds), [feeds]);
  const successfulFeeds = feeds.filter((feed) => feed.mangas.length > 0);

  if (feeds.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          title="Belum ada sumber aktif"
          description="Aktifkan setidaknya satu sumber untuk melihat peringkat."
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={mode}
          onChange={(value) => setMode(value as "combined" | "source")}
          options={[
            { value: "combined", label: "Gabungan" },
            { value: "source", label: "Per Sumber" },
          ]}
          layoutId="popular-mode"
          fullWidth
          className="sm:w-auto"
        />
        {mode === "combined" && (
          <p className="text-xs leading-relaxed text-text-muted sm:max-w-md sm:text-right">
            Urutan gabungan menghitung posisi tiap sumber, bukan menyamakan angka popularitasnya.
          </p>
        )}
      </div>

      {mode === "combined" ? (
        aggregated.length > 0 ? (
          <section aria-labelledby="popular-combined-heading">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2
                id="popular-combined-heading"
                className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl"
              >
                Peringkat Yomirra
              </h2>
              <span className="text-xs font-semibold text-text-muted">
                {aggregated.length} judul
              </span>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {aggregated.slice(0, 30).map((item, index) => (
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
              description="Sumber aktif belum memberikan data populer. Coba lagi nanti."
            />
          </div>
        )
      ) : (
        <div className="space-y-12">
          {feeds.map((feed) => (
            <section key={feed.sourceId} aria-labelledby={`popular-${feed.sourceId}`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2
                  id={`popular-${feed.sourceId}`}
                  className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl"
                >
                  {feed.sourceName}
                </h2>
                {!feed.loadFailed && feed.mangas.length > 0 && (
                  <Link
                    href={`/sources/${feed.sourceId}?sort=popular`}
                    className="inline-flex min-h-11 items-center px-1 text-sm font-bold text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Lihat semua
                  </Link>
                )}
              </div>

              {feed.mangas.length > 0 ? (
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {feed.mangas.slice(0, 15).map((manga, index) => (
                    <EditorialCard
                      key={manga.id}
                      manga={{ ...manga, rank: index + 1 }}
                      rank={index + 1}
                      sourceId={feed.sourceId}
                      priority={index < 4}
                      index={index}
                      animateReveal
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {feed.loadFailed
                      ? "Peringkat sumber ini belum bisa dimuat."
                      : "Belum ada data populer dari sumber ini."}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Coba lagi nanti.</p>
                </div>
              )}
            </section>
          ))}

          {successfulFeeds.length === 0 && (
            <div className="py-6">
              <EmptyState
                title="Belum ada peringkat yang tersedia"
                description="Coba lagi nanti."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
