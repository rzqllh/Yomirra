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
        "relative w-full overflow-hidden rounded-[18px] border border-border-subtle bg-surface-raised",
        className
      )}
    >
      {/* Decorative cover collage */}
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
                "absolute aspect-[2/3] overflow-hidden rounded-[10px] border border-border-subtle bg-surface-muted",
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
                  loaded ? "opacity-75 sm:opacity-85 lg:opacity-90" : "opacity-0"
                )}
              />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 flex min-h-[218px] flex-col justify-center p-5 sm:min-h-[220px] sm:max-w-[64%] sm:p-6 lg:max-w-[60%] lg:px-7">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent">
          {isReturning ? "LANJUT LAGI DI YOMIRRA" : "BACAANMU DIMULAI DI SINI"}
        </p>

        <h1
          id="home-hero-title"
          className="mb-4 text-[26px] sm:text-[30px] lg:text-[32px] font-black leading-[1.15] tracking-tight text-text-primary"
        >
          Mau baca apa hari ini?
        </h1>

        <div
          role="search"
          aria-label="Pencarian Beranda"
          className="w-full max-w-[500px]"
        >
          <button
            type="button"
            id="home-hero-search"
            aria-label="Cari judul atau kreator…"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
            className="flex h-12 w-full items-center gap-2.5 rounded-[12px] border border-border-strong bg-surface-overlay px-2.5 shadow-xs transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer select-none text-left active:scale-[0.995]"
          >
            <MagnifyingGlass
              size={19}
              weight="regular"
              className="ml-1 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              readOnly
              tabIndex={-1}
              placeholder="Cari judul atau kreator…"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted cursor-pointer pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-accent-on transition-colors hover:bg-accent-hover"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}


