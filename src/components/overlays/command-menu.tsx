"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { apiClient } from "@/shared/api-client";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useDiscoveryScopeStore } from "@/shared/store/discovery-scope-store";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";
import { resolveQuickSearchScope } from "@/shared/sources/discovery-source-policy";
import { isContentVisible } from "@/shared/sources/content-policy";
import type { MangaItem } from "@/shared/types/source";
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
import { getMangaDetailHref, getSearchHref } from "@/shared/lib/routes";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const restoreFocusRef = React.useRef(true);
  const router = useRouter();
  const pathname = usePathname();
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const languages = useSettingsStore((state) => state.preferredLanguages);
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources);
  const sourceId = useDiscoveryScopeStore((state) => state.sourceId);
  const registry = useQuery(sourceQueryOptions);
  const scope = React.useMemo(
    () => resolveQuickSearchScope(registry.data ?? [], disabledSources, sourceId, hideNsfw),
    [registry.data, disabledSources, sourceId, hideNsfw]
  );
  const scopeLabel = scope.source && !(hideNsfw && scope.source.isNsfw) ? scope.source.name : "Belum tersedia";
  const query = searchQuery.trim();
  const debouncedQuery = useDebounce(query, 180);
  const isDebouncing = query !== debouncedQuery;

  React.useEffect(() => {
    const openSearch = (value = "") => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && !active.closest('[role="dialog"]')) triggerRef.current = active;
      restoreFocusRef.current = true;
      setSearchQuery(value);
      setOpen(true);
    };
    const customOpen = (event: Event) => openSearch((event as CustomEvent<{ query?: string }>).detail?.query ?? "");
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
    };
    window.addEventListener("open-command-menu", customOpen);
    window.addEventListener("keydown", shortcut);
    return () => { window.removeEventListener("open-command-menu", customOpen); window.removeEventListener("keydown", shortcut); };
  }, []);

  const search = useQuery({
    queryKey: ["quick-search-v1", scope.sourceIds, debouncedQuery, hideNsfw, languages],
    queryFn: ({ signal }) => apiClient.searchGlobal(debouncedQuery, scope.sourceIds, 1, hideNsfw, undefined, { signal }),
    enabled: open && !registry.isError && scope.sourceIds.length > 0 && debouncedQuery.length >= 2 && !isDebouncing,
    retry: 1,
  });
  const results = React.useMemo(() => {
    if (!open || isDebouncing || !scope.sourceIds.length || registry.isError || !search.data || query.length < 2) return [];
    const allowed = new Set(scope.sourceIds);
    const items: (MangaItem & { sourceId: string })[] = search.data.canonicalResults?.length
      ? search.data.canonicalResults.map((item) => ({ ...item.primaryResult, sourceBindings: item.sourceBindings }))
      : Object.entries(search.data.resultsBySource).flatMap(([id, group]) => group.results.map((item) => ({ ...item, sourceId: id })));
    return items.filter((item) => allowed.has(item.sourceId) && isContentVisible(item, hideNsfw)).slice(0, 5);
  }, [open, isDebouncing, scope.sourceIds, registry.isError, search.data, query, hideNsfw]);
  const sourceFailures = Object.values(search.data?.resultsBySource ?? {}).filter((group) => group.error);
  const failed = search.isError || sourceFailures.length > 0;
  const loading = query.length >= 2 && (isDebouncing || search.isFetching);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearchQuery("");
      const trigger = triggerRef.current;
      if (restoreFocusRef.current) requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
      triggerRef.current = null;
    }
  };
  const navigate = (href: string) => { restoreFocusRef.current = false; setOpen(false); setSearchQuery(""); router.push(href); };

  let message = query.length < 2 ? "Ketik minimal 2 karakter untuk mencari judul." : "Tidak ada hasil di sumber Jelajah ini.";
  if (registry.isPending) message = "Memuat pilihan sumber Jelajah…";
  else if (registry.isError) message = "Daftar sumber belum bisa dimuat. Coba lagi.";
  else if (scope.reason === "empty") message = "Belum ada sumber Jelajah yang aktif. Pilih sumber di Jelajah.";
  else if (scope.reason === "unavailable") message = "Sumber Jelajah yang dipilih sedang tidak tersedia atau disembunyikan.";
  else if (scope.reason === "unsupported") message = "Sumber Jelajah ini belum mendukung pencarian cepat.";
  else if (loading) message = "Mencari di sumber Jelajah…";
  else if (failed) message = sourceFailures[0]?.error ?? "Pencarian belum bisa dimuat. Coba lagi.";

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput aria-label="Quick Search di sumber Jelajah" placeholder="Cari judul di Jelajah…" value={searchQuery} onValueChange={setSearchQuery} />
      <p className="border-b border-border-subtle px-4 py-2 pr-14 text-xs text-text-muted">
        Sumber Jelajah · <span className="font-semibold text-text-secondary">{scopeLabel}</span>
      </p>
      <CommandList key={scope.sourceId} className="min-h-0 flex-1 overflow-y-auto p-2">
        {(results.length === 0 || failed) && (
          <div role="status" aria-live="polite" className="px-3 py-5 text-sm leading-relaxed text-text-muted">
            <p>{message}</p>
            {(registry.isError || failed) && (
              <button type="button" className="mt-2 min-h-11 px-2 font-semibold text-accent focus-visible:outline-2"
                onClick={() => registry.isError ? void registry.refetch() : void search.refetch()}>Coba lagi</button>
            )}
          </div>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Hasil di Jelajah">
            {results.map((manga) => (
              <CommandItem key={`${manga.sourceId}:${manga.id}`} value={`${manga.sourceId}:${manga.id}`}
                onSelect={() => navigate(getMangaDetailHref(manga.sourceId, manga.id, pathname))}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-3 py-2">
                {manga.coverUrl ? <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-surface-muted">
                  <Image src={manga.coverUrl} alt="" fill className="object-cover" unoptimized />
                </div> : <MagnifyingGlass size={20} aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold text-text-primary">{manga.title}</span>
                  <span className="text-xs text-text-muted">{scopeLabel}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {query.length >= 2 && (
          <CommandGroup>
            <CommandItem value="open-discovery-search" onSelect={() => navigate(getSearchHref(query))}
              className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2">
              <div className="min-w-0">
                <span className="block text-sm font-semibold">Buka Cari</span>
                <span className="block text-xs leading-relaxed text-text-muted">Cari “{query}” memakai pilihan sumber Cari.</span>
              </div>
              <ArrowRight size={18} aria-hidden="true" />
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
      <div className="hidden shrink-0 border-t border-border-subtle px-4 py-2 text-xs text-text-muted sm:block">↑↓ pilih · Enter buka · Esc tutup</div>
    </CommandDialog>
  );
}
