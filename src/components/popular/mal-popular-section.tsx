"use client";

import * as React from "react";
import { useSettingsStore } from "@/shared/store/settings-store";
import Link from "next/link";
import Image from "next/image";
import type { MalPopularFeed, MalRankingType } from "@/shared/types/mal";
import { getSearchHref } from "@/shared/lib/routes";
import { ArrowRight, Sparkle, ArrowSquareOut, Star, SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { CustomSelect } from "@/components/ui/custom-select";

const RANKING_TYPE_OPTIONS: { value: MalRankingType; label: string }[] = [
  { value: "bypopularity", label: "Paling Populer" },
  { value: "all", label: "Skor Teratas" },
  { value: "favorite", label: "Favorit" },
  { value: "manhwa", label: "Top Manhwa" },
  { value: "manhua", label: "Top Manhua" },
];

const FORMAT_OPTIONS: { value: "all" | "manga" | "manhwa" | "manhua"; label: string }[] = [
  { value: "all", label: "Semua Format" },
  { value: "manga", label: "Manga" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
];

const SORT_OPTIONS = [
  { value: "rank", label: "Peringkat MAL" },
  { value: "score", label: "Skor Tertinggi" },
  { value: "members", label: "Anggota Terbanyak" },
  { value: "title-asc", label: "Judul A–Z" },
  { value: "title-desc", label: "Judul Z–A" },
];

export function MalPopularSection({
  feed,
  onSwitchToLocal,
}: {
  feed?: MalPopularFeed;
  onSwitchToLocal?: () => void;
}) {
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const [activeFeed, setActiveFeed] = React.useState<MalPopularFeed | undefined>(feed);
  const [selectedRankingType, setSelectedRankingType] = React.useState<MalRankingType>(
    feed?.status === "ready" && feed.rankingType ? feed.rankingType : "bypopularity"
  );
  const [formatFilter, setFormatFilter] = React.useState<"all" | "manga" | "manhwa" | "manhua">("all");
  const [sortBy, setSortBy] = React.useState<"rank" | "score" | "members" | "title-asc" | "title-desc">("rank");
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync if initial feed changes from server
  React.useEffect(() => {
    if (feed) {
      setActiveFeed(feed);
      if (feed.status === "ready" && feed.rankingType) {
        setSelectedRankingType(feed.rankingType);
      }
    }
  }, [feed]);

  const handleRankingTypeSelect = async (type: MalRankingType) => {
    if (type === selectedRankingType && activeFeed?.status === "ready") return;
    setSelectedRankingType(type);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/metadata/mal/popular?type=${encodeURIComponent(type)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const payload = (await res.json()) as { data?: MalPopularFeed };
        if (payload?.data) {
          setActiveFeed(payload.data);
        }
      }
    } catch {
      // Keep existing data on transient fetch failure
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeFeed || activeFeed.status !== "ready") {
    return (
      <section
        role="status"
        className="rounded-xl border border-border-subtle bg-surface-raised p-6 sm:p-8 flex flex-col items-center text-center max-w-xl mx-auto shadow-xs"
      >
        <div className="size-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
          <Sparkle size={24} weight="regular" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          Tren MyAnimeList belum terhubung
        </h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {activeFeed?.message ??
            "Snapshot tren eksternal MyAnimeList sedang tidak tersedia atau belum dikonfigurasi. Kamu tetap dapat menikmati peringkat judul populer langsung dari sumber bacaan aktif di Yomirra."}
        </p>
        {onSwitchToLocal && (
          <Button
            type="button"
            variant="primary"
            onClick={onSwitchToLocal}
            className="mt-5 rounded-xl font-bold gap-2 text-sm"
          >
            <span>Jelajahi Populer di Yomirra</span>
            <ArrowRight size={16} />
          </Button>
        )}
      </section>
    );
  }

  const visibleWorks = (() => {
    let works = activeFeed.works.filter((work) => !hideNsfw || work.nsfw === "white");

    if (formatFilter !== "all") {
      works = works.filter((w) => w.mediaType === formatFilter);
    }

    const sorted = [...works];
    switch (sortBy) {
      case "score":
        sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        break;
      case "members":
        sorted.sort((a, b) => (b.members ?? 0) - (a.members ?? 0));
        break;
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "rank":
      default:
        sorted.sort((a, b) => a.rank - b.rank);
        break;
    }
    return sorted;
  })();

  return (
    <section aria-labelledby="mal-popular-heading" className="space-y-6">
      {/* Editorial Overview Card */}
      <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 id="mal-popular-heading" aria-label="Populer MAL" className="text-xl font-bold text-text-primary">
              Populer MyAnimeList
            </h2>
            <p className="mt-1 text-sm text-text-secondary leading-relaxed">
              Metrik eksternal MyAnimeList berdasarkan pengguna global dan database resmi MAL. Bukan trafik internal Yomirra.
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-accent font-semibold self-start sm:self-center">
              <SpinnerGap size={16} className="animate-spin" />
              <span>Memperbarui…</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Peringkat resmi MAL dipertahankan. Snapshot{" "}
          {new Date(activeFeed.fetchedAt).toLocaleDateString("id-ID", {
            dateStyle: "medium",
            timeZone: "Asia/Jakarta",
          })}
          .
        </p>
      </div>

      {/* Control Filter Bar: Ranking Type & Sorting */}
      <div className="space-y-3.5">
        {/* Tier 1: MAL API Ranking Types */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] overscroll-x-contain touch-pan-x" role="group" aria-label="Tipe peringkat MAL">
          {RANKING_TYPE_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              selected={selectedRankingType === opt.value}
              onClick={() => handleRankingTypeSelect(opt.value)}
              variant={selectedRankingType === opt.value ? "accent-subtle" : "default"}
            />
          ))}
        </div>

        {/* Tier 2: Client Format Filter & Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-border-subtle/60">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:thin]" role="group" aria-label="Filter format manga">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setFormatFilter(fmt.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  formatFilter === fmt.value
                    ? "bg-surface-muted text-text-primary border border-border-strong font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-2xs text-text-muted font-medium">Urutkan:</span>
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={SORT_OPTIONS}
              label="Urutkan hasil MAL"
              className="w-44"
            />
          </div>
        </div>
      </div>

      {visibleWorks.length === 0 ? (
        <div role="status" className="rounded-xl border border-border-subtle bg-surface-raised p-8 text-center text-text-muted">
          Tidak ada judul yang memenuhi filter konten atau format pada snapshot ini.
        </div>
      ) : (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleWorks.map((work) => (
            <li
              key={work.malId}
              className="flex gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-all hover:border-accent/40 shadow-xs"
            >
              {work.coverUrl && (
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <Image
                    unoptimized
                    src={work.coverUrl}
                    alt=""
                    fill
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-2xs font-bold text-accent">
                      #{work.rank} · MyAnimeList
                    </span>
                    {typeof work.score === "number" && work.score > 0 && (
                      <span className="inline-flex items-center gap-1 text-2xs font-bold text-accent">
                        <Star size={12} weight="fill" className="text-accent" />
                        {work.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-bold text-sm leading-snug text-text-primary line-clamp-2">
                    {work.title}
                  </h3>
                  {work.members !== null && (
                    <p className="mt-1 text-xs text-text-muted">
                      {work.members.toLocaleString("id-ID")} anggota
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-subtle/50 pt-2.5">
                  <Link
                    href={getSearchHref(work.title)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>Cari sumber bacaan</span>
                    <ArrowRight size={12} />
                  </Link>
                  <a
                    href={`https://myanimelist.net/manga/${work.malId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-2xs font-medium text-text-muted hover:text-text-primary"
                  >
                    <span>MAL</span>
                    <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex justify-end pt-2">
        <a
          href="https://myanimelist.net/topmanga.php?type=bypopularity"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors underline"
        >
          <span>Sumber data peringkat: MyAnimeList Top Manga</span>
          <ArrowSquareOut size={13} />
        </a>
      </div>
    </section>
  );
}
