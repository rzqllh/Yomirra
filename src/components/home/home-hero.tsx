"use client";

import * as React from "react";
import Link from "next/link";
import { MagnifyingGlass, Sparkle, Compass, BookmarkSimple } from "@phosphor-icons/react";
import { usePlatformShortcut } from "@/shared/hooks/use-platform-shortcut";
import { useHistoryStore } from "@/shared/store/history-store";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useSettingsStore } from "@/shared/store/settings-store";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import type { MangaItem } from "@/shared/sources/source-types";
import { cn } from "@/shared/utils/cn";

export interface HeroCandidate {
  coverUrl: string;
  title: string;
  sourceId?: string;
  contentRating?: MangaItem["contentRating"];
  isNsfw?: boolean;
}

export interface HomeHeroProps {
  className?: string;
  candidates?: HeroCandidate[];
}

// v1 held raw, unclassified cover URLs. Never trust it in safe mode.
export const HERO_COLLAGE_CACHE_KEY = "yomirra_home_hero_collage_v2";

export function isVerifiedSafeHeroCandidate(candidate: HeroCandidate): boolean {
  // A missing registry entry is not proof that the provider is safe.
  const source = candidate.sourceId ? getSourceMetadata(candidate.sourceId) : undefined;
  return (
    candidate.contentRating === "safe" &&
    candidate.isNsfw !== true &&
    source !== undefined &&
    source.isNsfw !== true
  );
}

export function isEligibleSafeHeroCandidate(candidate: HeroCandidate): boolean {
  const source = candidate.sourceId ? getSourceMetadata(candidate.sourceId) : undefined;
  return (
    source !== undefined &&
    source.isNsfw !== true &&
    candidate.isNsfw !== true &&
    candidate.contentRating !== "suggestive" &&
    candidate.contentRating !== "erotica" &&
    candidate.contentRating !== "pornographic"
  );
}

function pickSessionCovers(candidates: HeroCandidate[], count = 3): HeroCandidate[] {
  const pool = candidates.slice(0, 15);
  const selected: HeroCandidate[] = [];

  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}

// Sophisticated layered editorial angles for the spotlight artwork
const coverCardStyles = [
  "right-1/4 sm:right-3/8 lg:right-1/3 top-2 sm:top-5 w-16 sm:w-21 lg:w-24 -rotate-3 z-10",
  "right-1/8 sm:right-1/5 lg:right-1/5 top-0 sm:top-2 w-17 sm:w-24 lg:w-26 rotate-2 z-20 shadow-xl",
  "hidden sm:block right-2 lg:right-3 top-6 sm:top-7 w-19 sm:w-22 lg:w-24 rotate-6 z-10",
] as const;

const EMPTY_CANDIDATES: HeroCandidate[] = [];

export function HomeHero({ className, candidates = EMPTY_CANDIDATES }: HomeHeroProps) {
  const mounted = useMounted();
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const { searchShortcut, searchAriaLabel } = usePlatformShortcut();

  const [sessionCovers, setSessionCovers] = React.useState<HeroCandidate[]>([]);
  const [loadedCovers, setLoadedCovers] = React.useState<Set<string>>(() => new Set());
  const [failedCovers, setFailedCovers] = React.useState<Set<string>>(() => new Set());
  const chosenMode = React.useRef<"safe" | "optin" | null>(null);
  const prevCandidatesRef = React.useRef<HeroCandidate[]>(candidates);

  // DEF-02: Only readers with actual local reading history are returning readers.
  // Authenticated accounts with zero history receive the discovery flow without layout displacement.
  const hasHistory = useHistoryStore((state) =>
    state?.items ? Object.keys(state.items).length > 0 : false
  );
  const isReturning = mounted && hasHistory;

  React.useEffect(() => {
    if (!mounted) return;
    const mode = hideNsfw ? "safe" : "optin";
    if (prevCandidatesRef.current !== candidates) {
      prevCandidatesRef.current = candidates;
      chosenMode.current = null;
    }
    if (chosenMode.current === mode) return;

    // Do not reuse unclassified v1 art from an earlier opt-in session.
    // Separate modes prevent accidentally exposing opted-in covers after OFF.
    const cacheKey = `${HERO_COLLAGE_CACHE_KEY}_${mode}`;
    const allowed = hideNsfw ? candidates.filter(isEligibleSafeHeroCandidate) : candidates;
    const allowedUrls = new Set(allowed.map((item) => item.coverUrl));

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: HeroCandidate[] = JSON.parse(cached);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (item) =>
              item?.coverUrl &&
              item?.title &&
              allowedUrls.has(item.coverUrl) &&
              (!hideNsfw || isEligibleSafeHeroCandidate(item))
          )
        ) {
          chosenMode.current = mode;
          setSessionCovers(parsed.slice(0, 3));
          return;
        }
      }
    } catch {
      // Session storage is optional. Never treat invalid cache as verified.
    }

    if (allowed.length === 0) {
      setSessionCovers((prev) => (prev.length === 0 ? prev : []));
      chosenMode.current = mode;
      return;
    }

    const selected = pickSessionCovers(allowed);
    chosenMode.current = mode;
    setSessionCovers(selected);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(selected));
    } catch {
      // Decorative artwork caching is non-critical.
    }
  }, [mounted, candidates, hideNsfw]);

  // Gate immediately during ON→OFF rerenders, before the effect updates state.
  const visibleCovers = hideNsfw
    ? sessionCovers.filter(
        (cover) =>
          isEligibleSafeHeroCandidate(cover) &&
          candidates.some(
            (current) =>
              current.coverUrl === cover.coverUrl && isEligibleSafeHeroCandidate(current)
          )
      )
    : sessionCovers;

  // Returning Reader: Minimal, compact global search with contextual quick-links
  if (isReturning) {
    return (
      <section
        aria-labelledby="home-hero-title"
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border-subtle/80 bg-surface-raised/70 p-4 sm:p-5 backdrop-blur-md transition-all shadow-xs",
          className
        )}
      >
        {/* Subtle ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent/[0.04] blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-2.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            <p className="text-2xs font-bold uppercase tracking-widest text-accent">
              LANJUT LAGI DI YOMIRRA
            </p>
          </div>

          <h1
            id="home-hero-title"
            className="text-lg sm:text-xl font-bold tracking-tight text-text-primary"
          >
            Mau baca apa hari ini?
          </h1>

          <div
            role="search"
            aria-label="Pencarian Beranda"
            className="relative w-full max-w-xl mt-0.5"
          >
            <button
              type="button"
              id="home-hero-search"
              aria-label={searchAriaLabel}
              disabled={!mounted}
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
              className="group flex h-11 w-full items-center gap-3 rounded-xl border border-border-subtle/80 bg-surface-base/85 px-3.5 shadow-none transition-all hover:border-accent/50 hover:bg-surface-hover/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer select-none text-left active:scale-95"
            >
              <MagnifyingGlass
                size={18}
                className="shrink-0 text-text-muted transition-colors group-hover:text-accent"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-medium text-text-muted truncate select-none">
                Cari judul atau kreator…
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-2xs font-mono font-semibold text-text-muted bg-surface-muted/80 border border-border-subtle/80">
                {searchShortcut}
              </kbd>
            </button>
          </div>

          {/* Contextual navigation pills for returning readers */}
          <div className="flex items-center gap-2 pt-0.5 text-xs text-text-muted">
            <span className="text-2xs font-medium text-text-muted/80">Pintas:</span>
            <Link
              href="/popular"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle/60 bg-surface-base/60 px-2.5 py-1 font-medium text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
            >
              <Sparkle size={13} className="text-accent" aria-hidden="true" />
              Populer
            </Link>
            <Link
              href="/bookmark"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle/60 bg-surface-base/60 px-2.5 py-1 font-medium text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
            >
              <BookmarkSimple size={13} aria-hidden="true" />
              Koleksi
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Zero-History Reader: Editorial Spotlight concept with layered interactive cover art and clear discovery CTAs
  return (
    <section
      aria-labelledby="home-hero-title"
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border-subtle/80 bg-gradient-to-br from-surface-raised via-surface-raised to-accent/5 transition-all min-h-44 sm:min-h-48 shadow-xs",
        className
      )}
    >
      {/* Ambient background glow behind artwork */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-accent/5 blur-3xl"
      />

      {/* Layered editorial artwork preview strictly for discovery sessions */}
      {visibleCovers.length > 0 && (
        <div
          className="absolute right-0 top-0 h-36 w-1/2 overflow-hidden sm:inset-y-0 sm:h-auto sm:w-1/2 lg:w-5/12 z-10"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 35%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 35%)",
          }}
        >
          {visibleCovers.map((cover, index) => {
            if (failedCovers.has(cover.coverUrl)) return null;
            const loaded = loadedCovers.has(cover.coverUrl);

            return (
              <div
                key={`${cover.coverUrl}-${index}`}
                title={cover.title}
                className={cn(
                  "absolute aspect-[2/3] overflow-hidden rounded-lg border border-border-subtle/80 bg-surface-muted shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:z-30 cursor-pointer",
                  coverCardStyles[index] ?? coverCardStyles[2]
                )}
              >
                <img
                  src={cover.coverUrl}
                  alt={cover.title}
                  referrerPolicy="no-referrer"
                  decoding="async"
                  loading="eager"
                  onLoad={() =>
                    setLoadedCovers((current) => {
                      const next = new Set(current);
                      next.add(cover.coverUrl);
                      return next;
                    })
                  }
                  onError={() =>
                    setFailedCovers((current) => {
                      const next = new Set(current);
                      next.add(cover.coverUrl);
                      return next;
                    })
                  }
                  className={cn(
                    "size-full object-cover transition-opacity duration-300",
                    loaded ? "opacity-75 hover:opacity-100 sm:opacity-85 lg:opacity-95" : "opacity-0"
                  )}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-center p-5 sm:max-w-3/5 sm:p-6 lg:max-w-7/12 lg:px-7 min-h-44 sm:min-h-48">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
          <p className="text-2xs font-bold uppercase tracking-widest text-accent">
            BACAANMU DIMULAI DI SINI
          </p>
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 border border-accent/20 px-2 py-0.5 text-2xs font-bold text-accent uppercase tracking-wider">
            <Sparkle size={11} weight="fill" />
            Katalog Multi-Sumber
          </span>
          <span className="hidden sm:inline-flex items-center rounded-md bg-surface-base/80 border border-border-subtle px-2 py-0.5 text-2xs font-semibold text-text-muted">
            9 Sumber Aktif
          </span>
        </div>

        <h1
          id="home-hero-title"
          className="mb-1 text-xl sm:text-2xl font-black leading-tight tracking-tight text-text-primary"
        >
          Mau baca apa hari ini?
        </h1>

        <p className="mb-3.5 text-xs sm:text-sm text-text-muted font-medium leading-relaxed max-w-md">
          Jelajahi ribuan komik dari berbagai sumber dalam satu antarmuka yang cepat dan terpadu.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full max-w-lg">
          <div
            role="search"
            aria-label="Pencarian Beranda"
            className="relative flex-1"
          >
            <button
              type="button"
              id="home-hero-search"
              aria-label={searchAriaLabel}
              disabled={!mounted}
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
              className="group flex h-11 w-full items-center gap-3 rounded-xl border border-border-default/80 bg-surface-base/90 px-3.5 shadow-none transition-all hover:border-accent/60 hover:bg-surface-hover/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer select-none text-left active:scale-95"
            >
              <MagnifyingGlass
                size={18}
                className="shrink-0 text-text-muted transition-colors group-hover:text-accent"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-medium text-text-muted truncate select-none">
                Cari judul atau kreator…
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-2xs font-mono font-semibold text-text-muted bg-surface-muted/80 border border-border-subtle/80">
                {searchShortcut}
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/popular"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border-subtle/80 bg-surface-base/80 px-3.5 text-xs font-semibold text-text-secondary hover:border-accent/50 hover:text-accent transition-colors"
            >
              <Sparkle size={14} className="text-accent" aria-hidden="true" />
              Populer
            </Link>
            <Link
              href="/library"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border-subtle/80 bg-surface-base/80 px-3.5 text-xs font-semibold text-text-secondary hover:border-accent/50 hover:text-accent transition-colors"
            >
              <Compass size={14} aria-hidden="true" />
              Jelajah
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
