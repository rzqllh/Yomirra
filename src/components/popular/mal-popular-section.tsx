"use client";

import * as React from "react";
import { useSettingsStore } from "@/shared/store/settings-store";
import Link from "next/link";
import Image from "next/image";
import type { MalPopularFeed, MalRankingType } from "@/shared/types/mal";
import { getSearchHref } from "@/shared/lib/routes";
import { ArrowRight, Sparkle, ArrowSquareOut, Star, SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ChipRail } from "@/components/ui/chip-rail";
import { FilterChip } from "@/components/ui/filter-chip";
import { CustomSelect } from "@/components/ui/custom-select";

type FormatFilter = "all" | "manga" | "manhwa" | "manhua";
type SortCriteria = "popularity" | "score" | "favorite" | "title-asc" | "title-desc";
type ReadyFeed = Extract<MalPopularFeed, { status: "ready" }>;

const FORMAT_OPTIONS: { value: FormatFilter; label: string }[] = [
  { value: "all", label: "Semua Format" },
  { value: "manga", label: "Manga" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
];

const SORT_OPTIONS: { value: SortCriteria; label: string }[] = [
  { value: "popularity", label: "Anggota terbanyak" },
  { value: "score", label: "Skor Tertinggi" },
  { value: "favorite", label: "Paling Difavoritkan" },
  { value: "title-asc", label: "Judul A–Z" },
  { value: "title-desc", label: "Judul Z–A" },
];

function resolveApiRankingType(format: FormatFilter, sort: SortCriteria): MalRankingType {
  if (format === "manhwa") return "manhwa";
  if (format === "manhua") return "manhua";
  if (format === "manga") return "manga";
  if (sort === "score") return "all";
  if (sort === "favorite") return "favorite";
  return "bypopularity";
}

export function MalPopularSection({
  feed,
  onSwitchToLocal,
}: {
  feed?: MalPopularFeed;
  onSwitchToLocal?: () => void;
}) {
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const [loadedFeed, setLoadedFeed] = React.useState<ReadyFeed>();
  const [selectedFormat, setSelectedFormat] = React.useState<FormatFilter>("all");
  const [sortBy, setSortBy] = React.useState<SortCriteria>("popularity");
  const [requestStatus, setRequestStatus] = React.useState<"idle" | "loading" | "error">("idle");
  const targetType = resolveApiRankingType(selectedFormat, sortBy);
  const initialFeed = feed?.status === "ready" ? feed : undefined;
  const activeFeed = loadedFeed?.rankingType === targetType
    ? loadedFeed
    : (initialFeed?.rankingType ?? "bypopularity") === targetType ? initialFeed : undefined;

  // In-memory feed cache by rankingType to enable instant tab switching
  const feedCacheRef = React.useRef<Partial<Record<MalRankingType, ReadyFeed>>>({});
  const requestIdRef = React.useRef(0);

  const loadRankingFeed = React.useCallback(async (targetType: MalRankingType) => {
    const requestId = ++requestIdRef.current;
    if (initialFeed && (initialFeed.rankingType ?? "bypopularity") === targetType) {
      setLoadedFeed(undefined);
      setRequestStatus("idle");
      return;
    }

    const cachedFeed = feedCacheRef.current[targetType];
    if (cachedFeed) {
      setLoadedFeed(cachedFeed);
      setRequestStatus("idle");
      return;
    }

    setLoadedFeed(undefined);
    setRequestStatus("loading");
    try {
      const res = await fetch(`/api/metadata/mal/popular?type=${encodeURIComponent(targetType)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const payload = (await res.json()) as { data?: MalPopularFeed };
        if (payload?.data?.status === "ready" && (payload.data.rankingType ?? targetType) === targetType) {
          const rankedFeed = { ...payload.data, rankingType: targetType };
          if (requestId === requestIdRef.current) {
            feedCacheRef.current[targetType] = rankedFeed;
            setLoadedFeed(rankedFeed);
            setRequestStatus("idle");
          }
          return;
        }
      }
    } catch {
      // Network and response errors share the same retry state.
    }
    if (requestId === requestIdRef.current) setRequestStatus("error");
  }, [initialFeed]);

  const handleFormatSelect = (format: FormatFilter) => {
    if (format === selectedFormat) return;
    setSelectedFormat(format);
    const targetType = resolveApiRankingType(format, sortBy);
    void loadRankingFeed(targetType);
  };

  const handleSortChange = (sort: SortCriteria) => {
    setSortBy(sort);
    const nextType = resolveApiRankingType(selectedFormat, sort);
    if (nextType !== targetType) void loadRankingFeed(nextType);
  };

  const formattedDate = React.useMemo(() => {
    if (!activeFeed) return "";
    try {
      return new Date(activeFeed.fetchedAt).toLocaleDateString("id-ID", {
        dateStyle: "medium",
        timeZone: "Asia/Jakarta",
      });
    } catch {
      return "";
    }
  }, [activeFeed]);

  const visibleWorks = React.useMemo(() => {
    if (!activeFeed) return [];
    let works = activeFeed.works.filter((work) => !hideNsfw || work.nsfw === "white");

    if (selectedFormat !== "all") {
      works = works.filter((w) => w.mediaType === selectedFormat || activeFeed.rankingType === selectedFormat);
    }

    const sorted = [...works];
    switch (sortBy) {
      case "popularity":
        sorted.sort((a, b) => (b.members ?? 0) - (a.members ?? 0) || a.rank - b.rank);
        break;
      case "score":
        sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.rank - b.rank);
        break;
      case "favorite":
        sorted.sort((a, b) => a.rank - b.rank);
        break;
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        sorted.sort((a, b) => a.rank - b.rank);
        break;
    }
    return sorted;
  }, [activeFeed, hideNsfw, selectedFormat, sortBy]);

  if (!initialFeed) {
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
          {(feed?.status !== "ready" ? feed?.message : undefined) ??
            "Tren MyAnimeList belum tersedia. Lihat peringkat dari sumber bacaan Yomirra."}
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

  return (
    <section aria-labelledby="mal-popular-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="mal-popular-heading" className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
            Peringkat Global MyAnimeList
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Database resmi MyAnimeList{formattedDate ? ` · Snapshot ${formattedDate}` : ""}.
          </p>
        </div>
        {requestStatus === "loading" && (
          <div role="status" className="flex items-center gap-1.5 text-xs text-accent font-semibold self-start sm:self-center">
            <SpinnerGap size={16} aria-hidden="true" className="motion-safe:animate-spin" />
            <span>Memperbarui…</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b border-border-subtle/60 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <ChipRail bleed={false} className="min-w-0 px-1 pt-1" role="group" aria-label="Filter format komik">
          {FORMAT_OPTIONS.map((fmt) => (
            <FilterChip
              key={fmt.value}
              label={fmt.label}
              selected={selectedFormat === fmt.value}
              onClick={() => handleFormatSelect(fmt.value)}
              variant={selectedFormat === fmt.value ? "accent-subtle" : "default"}
            />
          ))}
        </ChipRail>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <span className="text-2xs text-text-muted font-medium shrink-0">Urutkan:</span>
          <CustomSelect
            value={sortBy}
            onChange={(val) => handleSortChange(val as SortCriteria)}
            options={SORT_OPTIONS}
            label="Urutkan hasil MAL"
            className="min-w-0 flex-1 sm:w-56"
            align="left"
          />
        </div>
      </div>

      {requestStatus === "loading" ? null : requestStatus === "error" ? (
        <div className="rounded-xl border border-border-subtle bg-surface-raised p-8 text-center text-text-muted">
          <p role="status">Peringkat untuk pilihan ini gagal dimuat.</p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => void loadRankingFeed(targetType)}>
            Coba lagi
          </Button>
        </div>
      ) : visibleWorks.length === 0 ? (
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
                      #{work.rank} · MAL
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
                    <span>Cari di Sumber</span>
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
