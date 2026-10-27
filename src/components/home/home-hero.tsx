"use client";

import * as React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useAuth } from "@/shared/hooks/use-auth";
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
  const { user } = useAuth();

  const [sessionCovers, setSessionCovers] = React.useState<HeroCandidate[]>([]);
  const [loadedCovers, setLoadedCovers] = React.useState<Set<string>>(() => new Set());
  const [failedCovers, setFailedCovers] = React.useState<Set<string>>(() => new Set());
  const hasChosenCovers = React.useRef(false);

  const hasHistory = useHistoryStore((state) =>
    state?.items ? Object.keys(state.items).length > 0 : false
  );
  const isReturning = mounted && (Boolean(user) || hasHistory);

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
      // Session storage is optional. Keep the in-memory selection stable instead.
    }

    if (candidates.length === 0) return;

    const selected = pickSessionCovers(candidates);
    hasChosenCovers.current = true;
    setSessionCovers(selected);

    try {
      sessionStorage.setItem(HERO_COLLAGE_CACHE_KEY, JSON.stringify(selected));
    } catch {
      // Decorative artwork must never block the usable Hero.
    }
  }, [mounted, candidates]);

  return (
    <section
      aria-labelledby="home-hero-title"
      className={cn(
        "relative w-full overflow-hidden rounded-[20px] border border-border-subtle/80 bg-surface-raised/70 transition-all",
        isReturning ? "min-h-[170px] sm:min-h-[185px]" : "min-h-[200px] sm:min-h-[215px]",
        className
      )}
    >
      {/* Subtle decorative cover collage */}
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
                  loaded ? "opacity-60 sm:opacity-75 lg:opacity-80" : "opacity-0"
                )}
              />
            </div>
          );
        })}
      </div>

      <div className={cn(
        "relative z-10 flex flex-col justify-center p-5 sm:max-w-[64%] sm:p-6 lg:max-w-[60%] lg:px-7",
        isReturning ? "min-h-[170px] sm:min-h-[185px]" : "min-h-[200px] sm:min-h-[215px]"
      )}>
        <p className="mb-1.5 text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent">
          {isReturning ? "LANJUT LAGI DI YOMIRRA" : "BACAANMU DIMULAI DI SINI"}
        </p>

        <h1
          id="home-hero-title"
          className="mb-3.5 text-[22px] sm:text-[28px] lg:text-[30px] font-black leading-[1.15] tracking-tight text-text-primary"
        >
          Mau baca apa hari ini?
        </h1>

        <div
          role="search"
          aria-label="Pencarian Beranda"
          className="relative w-full max-w-[480px]"
        >
          <button
            type="button"
            id="home-hero-search"
            aria-label="Cari judul atau kreator…"
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
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-text-muted bg-surface-muted/80 border border-border-subtle/80">
              ⌘K
            </kbd>
          </button>
          <input
            type="text"
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            placeholder="Cari judul atau kreator…"
            className="sr-only"
          />
        </div>
      </div>
    </section>
  );
}
