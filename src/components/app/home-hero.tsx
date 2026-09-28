"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { useAuth } from "@/shared/hooks/use-auth"
import { useHistoryStore } from "@/shared/store/history-store"
import { useSearchFilterStore } from "@/shared/store/search-filter-store"
import { useMounted } from "@/shared/hooks/use-mounted"
import { cn } from "@/shared/utils/cn"

export interface HeroCandidate {
  coverUrl: string
  title: string
}

export interface HomeHeroProps {
  className?: string
  candidates?: HeroCandidate[]
}

const HERO_COVER_CACHE_KEY = "yomirra_hero_manga_cover"

export function HomeHero({ className, candidates = [] }: HomeHeroProps) {
  const router = useRouter()
  const mounted = useMounted()
  const { user } = useAuth()
  const [query, setQuery] = React.useState("")
  const [heroCover, setHeroCover] = React.useState<HeroCandidate | null>(null)
  const [imageError, setImageError] = React.useState(false)
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)

  const hasHistory = useHistoryStore((state) => (state?.items ? Object.keys(state.items).length > 0 : false))
  const isReturning = mounted && (Boolean(user) || hasHistory)

  // Pick random updated manga cover and cache it in sessionStorage
  React.useEffect(() => {
    if (!mounted || candidates.length === 0) return

    try {
      const cached = sessionStorage.getItem(HERO_COVER_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.coverUrl) {
          setHeroCover(parsed)
          return
        }
      }

      // Random from top 15 latest updated mangas
      const pool = candidates.slice(0, 15)
      const randomIndex = Math.floor(Math.random() * pool.length)
      const selected = pool[randomIndex]

      if (selected?.coverUrl) {
        setHeroCover(selected)
        sessionStorage.setItem(HERO_COVER_CACHE_KEY, JSON.stringify(selected))
      }
    } catch {
      // If sessionStorage fails, pick random in memory
      const pool = candidates.slice(0, 15)
      const selected = pool[Math.floor(Math.random() * pool.length)]
      if (selected?.coverUrl) {
        setHeroCover(selected)
      }
    }
  }, [mounted, candidates])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    useSearchFilterStore.getState().resetFilters()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/search")
    }
  }

  const showCover = Boolean(heroCover?.coverUrl && !imageError)

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/10 select-none",
        "bg-gradient-to-br from-[#fcf9f6] via-[#f7f2ed] to-[#eee4da] dark:from-[#191b26] dark:via-[#13151f] dark:to-[#0d0f16]",
        "shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgb(0,0,0,0.4)]",
        className
      )}
    >
      {/* Ambient Lighting Glows */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-1/4 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] bg-accent/10 dark:bg-accent/18 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Desktop / Landscape Character Artwork (Image 4 reference) */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute right-0 top-0 bottom-0 w-[420px] lg:w-[480px] xl:w-[540px] max-w-[48%] h-full pointer-events-none overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.5) 45%, black 80%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.5) 45%, black 80%)",
        }}
      >
        {/* Skeleton loading when candidates pending or image fetching */}
        {(!showCover || !isImageLoaded) && !imageError && (
          <div className="absolute inset-0 bg-neutral-200/40 dark:bg-white/[0.04] animate-pulse" />
        )}

        {showCover && (
          <img
            src={heroCover!.coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            decoding="async"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              "size-full object-cover object-[center_top] transition-opacity duration-700",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Soft edge blend overlay */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#fcf9f6] via-[#fcf9f6]/40 to-transparent dark:from-[#191b26] dark:via-[#191b26]/40" />
      </div>

      {/* Mobile Top-Right Character Artwork (Image 3 reference) */}
      <div
        aria-hidden="true"
        className="md:hidden absolute top-0 right-0 w-[80%] sm:w-[70%] h-[230px] sm:h-[250px] pointer-events-none overflow-hidden"
        style={{
          maskImage: "radial-gradient(ellipse at 85% 20%, black 45%, rgba(0,0,0,0.4) 70%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 85% 20%, black 45%, rgba(0,0,0,0.4) 70%, transparent 100%)",
        }}
      >
        {/* Skeleton loading when candidates pending or image fetching */}
        {(!showCover || !isImageLoaded) && !imageError && (
          <div className="absolute inset-0 bg-neutral-200/40 dark:bg-white/[0.04] animate-pulse" />
        )}

        {showCover && (
          <img
            src={heroCover!.coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            decoding="async"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              "size-full object-cover object-[center_top] transition-opacity duration-700",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Seamless edge blend overlay */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#fcf9f6] via-[#fcf9f6]/60 to-transparent dark:from-[#191b26] dark:via-[#191b26]/60" />
      </div>

      {/* Mobile Bottom Readability Mask Overlay */}
      <div
        aria-hidden="true"
        className="md:hidden absolute inset-0 bg-gradient-to-t from-[#fcf9f6] via-[#fcf9f6]/80 to-transparent dark:from-[#191b26] dark:via-[#191b26]/80 pointer-events-none"
      />

      {/* Content Layout */}
      <div className="relative z-10 flex flex-col justify-end md:justify-center w-full min-h-[300px] sm:min-h-[320px] md:min-h-[275px] lg:min-h-[295px] p-5 sm:p-7 md:p-8 lg:p-10 md:w-[58%] lg:w-[54%]">
        {/* Eyebrow Label */}
        <span className="text-[11px] sm:text-[12.5px] font-extrabold uppercase tracking-[0.14em] text-accent mb-1.5 sm:mb-2 leading-none">
          {isReturning ? "SELAMAT DATANG KEMBALI," : "SELAMAT DATANG,"}
        </span>

        {/* Heading */}
        <h1 className="text-[23px] leading-[1.18] sm:text-3xl md:text-3xl lg:text-[34px] font-black tracking-tight text-text-primary mb-5 sm:mb-6">
          Temukan komik <br className="hidden sm:inline" />
          favoritmu di <span className="text-accent font-black">Yomirra</span>
        </h1>

        {/* Search Input Bar Pill */}
        <form
          onSubmit={handleSearch}
          className="relative flex items-center justify-between w-full max-w-[500px] h-14 sm:h-[58px] rounded-full bg-white dark:bg-[#1a1d28] border border-black/[0.08] dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] px-3.5 sm:px-4 gap-2.5 sm:gap-3 transition-all focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20"
        >
          <MagnifyingGlass size={20} weight="regular" className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, genre, author, atau source..."
            className="flex-1 min-w-0 bg-transparent text-[13px] sm:text-sm text-text-primary placeholder:text-text-muted/80 outline-none font-medium"
          />
          <button
            type="submit"
            aria-label="Cari"
            className="size-10 sm:size-11 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all outline-none cursor-pointer"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
        </form>
      </div>
    </div>
  )
}
