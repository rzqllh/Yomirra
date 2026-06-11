"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/shared/api-client"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useSettingsStore } from "@/shared/store/settings-store"
import {
  House,
  Books,
  Clock,
  Compass,
  Gear,
  MagnifyingGlass,
  CircleNotch,
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
  { label: "Riwayat", href: "/history", icon: Clock },
  { label: "Sumber", href: "/sources", icon: Compass },
  { label: "Pengaturan", href: "/settings", icon: Gear },
]

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()

  // Keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

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
                  handleSelect(getMangaDetailHref(activeSourceId, manga.id))
                }
              >
                <MagnifyingGlass className="mr-2 h-4 w-4 text-text-muted" weight="bold" />
                <span className="truncate">{manga.title}</span>
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

