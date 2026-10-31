"use client";

import * as React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { usePlatformShortcut } from "@/shared/hooks/use-platform-shortcut";
import { useHistoryStore } from "@/shared/store/history-store";
import { useMounted } from "@/shared/hooks/use-mounted";
import { cn } from "@/shared/utils/cn";

export interface HeroCandidate {
  coverUrl: string;
  title: string;
}

export interface HomeHeroProps {
  className?: string;
  candidates?: HeroCandidate[];
}

export const HERO_COLLAGE_CACHE_KEY = "yomirra_home_hero_collage_v1";

function pickSessionCovers(candidates: HeroCandidate[], count = 3): HeroCandidate[] {
  const pool = candidates.slice(0, 15);
  const selected: HeroCandidate[] = [];

  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}

const coverPositions = [
  "right-[28%] sm:right-[46%] top-3 sm:top-7 w-[58px] sm:w-[78px] lg:w-[86px]",
  "right-[4%] sm:right-[22%] top-1 sm:top-3 w-[64px] sm:w-[90px] lg:w-[98px]",
  "hidden sm:block right-[3%] top-8 w-[80px] lg:w-[88px]",
] as const;

export function HomeHero({ className, candidates = [] }: HomeHeroProps) {
  const mounted = useMounted();
  const { searchShortcut, searchAriaLabel } = usePlatformShortcut();

  const [sessionCovers, setSessionCovers] = React.useState<HeroCandidate[]>([]);
  const [loadedCovers, setLoadedCovers] = React.useState<Set<string>>(() => new Set());
  const [failedCovers, setFailedCovers] = React.useState<Set<string>>(() => new Set());
  const hasChosenCovers = React.useRef(false);

  // CRITICAL FIX (DEF-02): Only readers with actual local reading history are returning readers.
  // Authenticated accounts with zero history receive the discovery flow without layout displacement.
  const hasHistory = useHistoryStore((state) =>
    state?.items ? Object.keys(state.items).length > 0 : false
  );
  const isReturning = mounted && hasHistory;

  React.useEffect(() => {
    if (!mounted || hasChosenCovers.current) return;

    try {
      const cached = sessionStorage.getItem(HERO_COLLAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((item) => item?.coverUrl && item?.title)
        ) {
          hasChosenCovers.current = true;
          setSessionCovers(parsed.slice(0, 3));
          return;
        }
      }
    } catch {
      // Session storage is optional. Keep in-memory selection stable.
    }

    if (candidates.length === 0) return;

    const selected = pickSessionCovers(candidates);
    hasChosenCovers.current = true;
    setSessionCovers(selected);

    try {
      sessionStorage.setItem(HERO_COLLAGE_CACHE_KEY, JSON.stringify(selected));
    } catch {
      // Decorative artwork caching is non-critical.
    }
  }, [mounted, candidates]);

  // Returning Reader: Minimal, compact global search without collage or promotional card
  if (isReturning) {
    return (
      <section
        aria-labelledby="home-hero-title"
        className={cn(
          "relative w-full rounded-2xl border border-border-subtle/80 bg-surface-raised/60 p-4 sm:p-5 backdrop-blur-md transition-all",
          className
        )}
      >
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
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
              className="group flex h-11 w-full items-center gap-3 rounded-xl border border-border-subtle/80 bg-surface-base/80 px-3.5 shadow-none transition-all hover:border-accent/50 hover:bg-surface-hover/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer select-none text-left active:scale-[0.995]"
            >
              <MagnifyingGlass
                size={18}
                className="shrink-0 text-text-muted transition-colors group-hover:text-accent"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 bg-transparent text-[13px] sm:text-sm font-medium text-text-muted truncate select-none">
                Cari judul atau kreator…
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-text-muted bg-surface-muted/80 border border-border-subtle/80">{searchShortcut}</kbd>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Zero-History Reader: Clean discovery guidance with restrained artwork presentation
  return (
    <section
      aria-labelledby="home-hero-title"
      className={cn(
        "relative w-full overflow-hidden rounded-[20px] border border-border-subtle/80 bg-surface-raised/70 transition-all min-h-[170px] sm:min-h-[190px]",
        className
      )}
    >
      {/* Subtle artwork preview strictly for new discovery sessions */}
      {sessionCovers.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-[140px] w-[50%] overflow-hidden sm:inset-y-0 sm:h-auto sm:w-[46%] lg:w-[42%]"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 38%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%)",
          }}
        >
          {sessionCovers.map((cover, index) => {
            if (failedCovers.has(cover.coverUrl)) return null;
            const loaded = loadedCovers.has(cover.coverUrl);

            return (
              <div
                key={`${cover.coverUrl}-${index}`}
                className={cn(
                  "absolute aspect-[2/3] overflow-hidden rounded-[10px] border border-border-subtle/60 bg-surface-muted",
                  coverPositions[index] ?? coverPositions[2]
                )}
              >
                <img
                  src={cover.coverUrl}
                  alt=""
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
                    "size-full object-cover transition-opacity duration-200",
                    loaded ? "opacity-50 sm:opacity-65 lg:opacity-70" : "opacity-0"
                  )}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-center p-5 sm:max-w-[64%] sm:p-6 lg:max-w-[60%] lg:px-7 min-h-[170px] sm:min-h-[190px]">
        <p className="mb-1 text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent">
          BACAANMU DIMULAI DI SINI
        </p>

        <h1
          id="home-hero-title"
          className="mb-1 text-[22px] sm:text-[26px] font-black leading-[1.15] tracking-tight text-text-primary"
        >
          Mau baca apa hari ini?
        </h1>

        <p className="mb-3 text-xs sm:text-sm text-text-muted font-medium leading-relaxed max-w-md">
          Jelajahi ribuan komik dari berbagai sumber dalam satu antarmuka yang cepat dan terpadu.
        </p>

        <div
          role="search"
          aria-label="Pencarian Beranda"
          className="relative w-full max-w-[480px]"
        >
          <button
            type="button"
            id="home-hero-search"
            aria-label={searchAriaLabel}
            disabled={!mounted}
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
            className="group flex h-11 sm:h-12 w-full items-center gap-3 rounded-full border border-border-default/70 bg-surface-base/90 px-3.5 sm:px-4 shadow-none transition-all hover:border-accent/60 hover:bg-surface-hover/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer select-none text-left active:scale-[0.995]"
          >
            <MagnifyingGlass
              size={18}
              className="shrink-0 text-text-muted transition-colors group-hover:text-accent"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 bg-transparent text-[13px] sm:text-sm font-medium text-text-muted truncate select-none">
              Cari judul atau kreator…
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-text-muted bg-surface-muted/80 border border-border-subtle/80">{searchShortcut}</kbd>
          </button>
        </div>
      </div>
    </section>
  );
}
