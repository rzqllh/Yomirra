"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/shared/api-client"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useSettingsStore } from "@/shared/store/settings-store"
import { sourceRegistry } from "@/shared/sources/source-registry"
import { MangaItem } from "@/shared/types/source"
import {
  MagnifyingGlass,
  ArrowRight,
} from "@phosphor-icons/react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { getMangaDetailHref } from "@/shared/lib/routes"

// Nav items removed as it's now search only

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const restoreFocusOnCloseRef = React.useRef(true)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    const openSearch = (query = "") => {
      if (pathname === "/search") {
        window.dispatchEvent(new CustomEvent("focus-search-input", { detail: { query } }));
        return;
      }
      triggerRef.current =
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
          ? document.activeElement
          : null;
      restoreFocusOnCloseRef.current = true;
      setSearchQuery(query);
      setOpen(true);
    };

    const handleCustomOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string }>;
      openSearch(customEvent.detail?.query ?? "");
    };

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    };

    window.addEventListener("open-command-menu", handleCustomOpen);
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("open-command-menu", handleCustomOpen);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [pathname]);

  // Search manga globally with word debounce & timeout limiting
  const debouncedQuery = useDebounce(searchQuery.trim(), 350)
  const isNsfwFiltered = useSettingsStore((state) => state.hideNsfw)
  // Global Search intentionally ignores Library/Popular source toggles.
  // Only sources that are operationally unavailable are excluded here.
  const activeSources = React.useMemo(() => {
    return sourceRegistry
      .filter((source) =>
        source.isEnabled &&
        source.isInstalled &&
        source.status !== "unavailable" &&
        source.status !== "in-fix"
      )
      .map((source) => source.id);
  }, []);

  const { data: globalSearchData, isLoading: isSearching } = useQuery({
    queryKey: ["command-search-global", debouncedQuery, isNsfwFiltered, activeSources],
    queryFn: () => apiClient.searchGlobal(debouncedQuery, activeSources, 1, isNsfwFiltered),
    enabled: debouncedQuery.length >= 2,
  })

  const previewResults = React.useMemo(() => {
    if (!globalSearchData) return [];
    // Priority: consume backend canonicalResults directly (Single Ownership)
    if (globalSearchData.canonicalResults && globalSearchData.canonicalResults.length > 0) {
      return globalSearchData.canonicalResults.map((c) => ({
        ...c.primaryResult,
        sourceBindings: c.sourceBindings,
      })).slice(0, 5);
    }
    // Narrow compatibility fallback for raw legacy results
    if (globalSearchData.resultsBySource) {
      const allResults: (MangaItem & { sourceId: string })[] = [];
      Object.entries(globalSearchData.resultsBySource).forEach(([sourceId, sourceData]) => {
        if (sourceData.results) {
          sourceData.results.forEach((manga) => {
            allResults.push({ ...manga, sourceId });
          });
        }
      });
      return allResults.slice(0, 5);
    }
    return [];
  }, [globalSearchData]);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen && restoreFocusOnCloseRef.current) {
      const trigger = triggerRef.current
      requestAnimationFrame(() => {
        trigger?.focus({ preventScroll: true })
      })
    }
  }, [])

  const handleSelect = (href: string) => {
    restoreFocusOnCloseRef.current = false
    setOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Cari judul atau kreator…"
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="max-h-[380px] p-2 overflow-y-auto">
        <CommandEmpty>
          {searchQuery.trim().length < 2 ? (
            <div className="py-8 text-center select-none">
              <p className="font-bold text-text-primary text-sm">Mulai ketik judul</p>
              <p className="text-xs text-text-muted mt-1">Minimal 2 karakter untuk menampilkan saran.</p>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col gap-2 p-3">
              <div className="h-4 w-1/4 bg-surface-muted rounded animate-pulse mb-1" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-1">
                  <div className="h-12 w-9 rounded-md bg-surface-muted animate-pulse shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3.5 w-3/4 bg-surface-muted rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-surface-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center select-none">
              <p className="font-bold text-text-primary text-sm">Belum ketemu</p>
              <p className="text-xs text-text-muted mt-1">Coba kata kunci lain, atau lanjutkan ke halaman Cari.</p>
            </div>
          )}
        </CommandEmpty>

        {/* Search Results */}
        {previewResults.length > 0 && (
          <CommandGroup heading="Pilihan Judul">
            {previewResults.map((manga) => {
              const href = getMangaDetailHref(manga.sourceId, manga.id, pathname);
              return (
                <CommandItem
                  key={`${manga.sourceId}-${manga.id}`}
                  value={`${manga.title} ${manga.sourceId} ${manga.id}`}
                  onSelect={() => handleSelect(href)}
                  onClick={() => handleSelect(href)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[12px] cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  {manga.coverUrl ? (
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[6px] border border-border-subtle bg-surface-muted shadow-xs">
                      <Image
                        src={manga.coverUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-12 w-9 shrink-0 rounded-[6px] bg-surface-muted text-text-muted">
                      <MagnifyingGlass size={16} weight="bold" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate font-bold text-text-primary text-sm">{manga.title}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent-dim text-accent uppercase tracking-wider">
                        {manga.sourceId}
                      </span>
                      {manga.latestChapter && (
                        <span className="truncate text-[11px]">{manga.latestChapter}</span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {searchQuery.trim().length > 0 && (
          <CommandGroup>
            <CommandItem
              value={`search-all-${searchQuery}`}
              onSelect={() => handleSelect(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
              onClick={() => handleSelect(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[12px] cursor-pointer border border-border-subtle bg-surface-raised hover:bg-surface-hover"
            >
              <div className="min-w-0">
                <span className="block text-sm font-bold text-text-primary truncate">
                  Lihat hasil lainnya
                </span>
                <span className="block text-[11px] text-text-muted truncate">
                  Cari &ldquo;{searchQuery.trim()}&rdquo; di semua sumber
                </span>
              </div>
              <ArrowRight size={16} weight="bold" className="text-accent shrink-0" />
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>

      <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-surface-muted/30 border-t border-border-subtle text-[11px] text-text-muted select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-accent uppercase tracking-wider text-[10px]">Yomirra</span>
          <span>· Pencarian</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-surface-base border border-border-subtle">↑↓</kbd> pilih</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-surface-base border border-border-subtle">↵</kbd> buka</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-surface-base border border-border-subtle">esc</kbd> tutup</span>
        </div>
      </div>
    </CommandDialog>
  )
}
