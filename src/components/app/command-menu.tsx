"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/shared/api-client"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useSettingsStore } from "@/shared/store/settings-store"
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

const NAV_ITEMS = [
  { label: "Beranda", href: "/", icon: House },
  { label: "Library", href: "/library", icon: Books },
  { label: "Bookmark", href: "/bookmark", icon: BookmarkSimple },
  { label: "Sumber", href: "/sources", icon: Compass },
  { label: "Pengaturan", href: "/settings", icon: Gear },
]

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()
  const pathname = usePathname()

  // Toggle logic
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-menu", handleCustomOpen);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-menu", handleCustomOpen);
    };
  }, []);

  // Search manga from active source
  const activeSourceId = "shinigami"
  const debouncedQuery = useDebounce(searchQuery, 300)
  const isNsfwFiltered = useSettingsStore((state) => state.hideNsfw)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["command-search", activeSourceId, debouncedQuery, isNsfwFiltered],
    queryFn: () => apiClient.search(activeSourceId, debouncedQuery, 1, undefined, isNsfwFiltered),
    enabled: debouncedQuery.length >= 2,
  })

  const handleSelect = (href: string) => {
    setOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Cari judul atau navigasi..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <CircleNotch className="h-4 w-4 motion-safe:animate-spin text-text-muted" weight="bold" />
              <span>Mencari...</span>
            </div>
          ) : (
            "Tidak ada hasil yang cocok."
          )}
        </CommandEmpty>

        {/* Search Results */}
        {searchResults && searchResults.results.length > 0 && (
          <CommandGroup heading="Hasil Pencarian">
            {searchResults.results.slice(0, 6).map((manga) => (
              <CommandItem
                key={manga.id}
                value={manga.title}
                onSelect={() =>
                  handleSelect(getMangaDetailHref(activeSourceId, manga.id, pathname))
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
                  {manga.latestChapter && (
                    <span className="truncate text-xs text-text-muted mt-0.5">{manga.latestChapter}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Buka halaman">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 h-4 w-4 text-text-muted" weight="regular" />
                {item.label}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

