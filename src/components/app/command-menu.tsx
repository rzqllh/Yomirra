"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/shared/api-client"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useSettingsStore } from "@/shared/store/settings-store"
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store"
import { sourceRegistry } from "@/shared/sources/source-registry"
import { MangaItem } from "@/shared/types/source"
import {
  House,
  Books,
  Compass,
  Gear,
  MagnifyingGlass,
  CircleNotch,
  BookmarkSimple,
} from "@phosphor-icons/react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { getMangaDetailHref } from "@/shared/lib/routes"

// Nav items removed as it's now search only

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    const handleCustomOpen = () => setOpen(true);
    window.addEventListener("open-command-menu", handleCustomOpen);
    
    return () => {
      window.removeEventListener("open-command-menu", handleCustomOpen);
    };
  }, []);

  // Search manga globally
  const debouncedQuery = useDebounce(searchQuery, 300)
  const isNsfwFiltered = useSettingsStore((state) => state.hideNsfw)
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources)
  
  const activeSources = React.useMemo(() => {
    return sourceRegistry
      .filter(s => s.isEnabled && s.isInstalled && s.status !== "unavailable" && !disabledSources.includes(s.id))
      .map(s => s.id);
  }, [disabledSources]);

  const { data: globalSearchData, isLoading: isSearching } = useQuery({
    queryKey: ["command-search-global", debouncedQuery, isNsfwFiltered, activeSources],
    queryFn: () => apiClient.searchGlobal(debouncedQuery, activeSources, 1, isNsfwFiltered),
    enabled: debouncedQuery.length >= 2,
  })

  const previewResults = React.useMemo(() => {
    if (!globalSearchData || !globalSearchData.resultsBySource) return [];
    const allResults: (MangaItem & { sourceId: string })[] = [];
    Object.entries(globalSearchData.resultsBySource).forEach(([sourceId, sourceData]) => {
      if (sourceData.results) {
        sourceData.results.forEach(manga => {
          allResults.push({ ...manga, sourceId });
        });
      }
    });
    return allResults.slice(0, 6);
  }, [globalSearchData]);

  const handleSelect = (href: string) => {
    setOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Cari judul atau navigasi..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex flex-col gap-2 p-2">
              <div className="h-6 w-1/3 bg-surface-muted rounded animate-pulse mb-2" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-2">
                  <div className="h-12 w-9 rounded bg-surface-muted animate-pulse shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-3/4 bg-surface-muted rounded animate-pulse" />
                    <div className="h-3 w-1/4 bg-surface-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            "Tidak ada hasil yang cocok."
          )}
        </CommandEmpty>

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <CommandGroup heading="Aksi">
            <CommandItem
              value={`search-all-${searchQuery}`}
              onSelect={() => handleSelect(`/search?q=${encodeURIComponent(searchQuery)}`)}
              className="flex items-center gap-3 py-3 cursor-pointer"
            >
              <div className="flex items-center justify-center h-12 w-9 shrink-0 rounded bg-accent/10 text-accent">
                <MagnifyingGlass weight="bold" size={20} />
              </div>
              <span className="font-bold text-text-primary">Lihat semua hasil untuk &quot;{searchQuery}&quot;</span>
            </CommandItem>
          </CommandGroup>
        )}

        {previewResults.length > 0 && (
          <CommandGroup heading="Preview Hasil">
            {previewResults.map((manga) => (
              <CommandItem
                key={`${manga.sourceId}-${manga.id}`}
                value={`${manga.sourceId}-${manga.id}`}
                onSelect={() =>
                  handleSelect(getMangaDetailHref(manga.sourceId, manga.id, pathname))
                }
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                {manga.coverUrl ? (
                  <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-surface-muted shadow-sm">
                    <Image 
                      src={manga.coverUrl} 
                      alt="" 
                      fill
                      className="object-cover transition-transform group-hover:scale-105" 
                      unoptimized
                    />
                  </div>
                ) : (
                  <MagnifyingGlass className="h-5 w-5 text-text-muted shrink-0" weight="bold" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-bold text-text-primary text-sm">{manga.title}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="truncate text-xs font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent uppercase tracking-wider">{manga.sourceId}</span>
                    {manga.latestChapter && (
                      <span className="truncate text-xs text-text-muted">{manga.latestChapter}</span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

