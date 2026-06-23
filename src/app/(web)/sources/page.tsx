"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { HardDrives, Plus } from "@phosphor-icons/react";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { SourceCard } from "@/components/source/source-card";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { YomirraSurface } from "@/components/ui/layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { AddCustomSourceSheet } from "@/components/source/add-custom-source-sheet";
import { Button } from "@/components/ui/button";

export default function SourcesPage() {
  const [filter, setFilter] = React.useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [localSources, setLocalSources] = React.useState<import("@/shared/sources/source-types").SourceMetadata[]>([]);

  // Load custom sources from localStorage on mount
  const loadLocalSources = React.useCallback(() => {
    setLocalSources(dynamicSourceRegistry.getAll());
  }, []);

  React.useEffect(() => {
    loadLocalSources();
  }, [loadLocalSources]);

  const { data: serverSources, isLoading, isError } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const allSources = React.useMemo(() => {
    const s = [...(serverSources || [])];
    // Merge local sources
    localSources.forEach(ls => {
      if (!s.find(x => x.id === ls.id)) {
        s.push(ls);
      }
    });
    return s;
  }, [serverSources, localSources]);

  const filteredSources = React.useMemo(() => {
    if (!filter.trim()) return allSources;
    const lower = filter.toLowerCase();
    return allSources.filter(s => s.name.toLowerCase().includes(lower) || s.language?.toLowerCase().includes(lower));
  }, [allSources, filter]);

  return (
    <DirectionalTransition>
      <div className="flex flex-col min-h-screen">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8 relative">
          <div className="px-4 pt-[calc(var(--safe-top)+24px)] md:px-8 pb-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex-1 w-full">
              <DesktopPageTitle 
                title="Sumber" 
                description="Kelola sumber bacaan untuk Yomirra."
                icon={<HardDrives size={32} weight="duotone" />}
              />
            </div>
            
            {/* Desktop Add Button */}
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              variant="accent"
              className="hidden md:flex rounded-full font-bold shadow-sm shrink-0"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Tambah Kustom
            </Button>
          </div>

          <div className="md:hidden flex gap-2 px-4 py-4 pb-2 border-b border-border-subtle bg-surface-base sticky top-[calc(var(--mobile-header-height)+var(--safe-top))] z-[var(--z-sticky)]">
            <div className="flex-1">
              <SearchInput
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Cari sumber terinstall..."
              />
            </div>
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              variant="accent"
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0 shadow-sm"
            >
              <Plus size={20} weight="bold" />
            </Button>
          </div>

          <div className="hidden md:block px-4 pb-6">
            <SearchInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari sumber manga..."
            />
          </div>

          <div className="p-4 pt-4">
            {isLoading ? (
              <SourceListSkeleton />
            ) : isError ? (
              <EmptyState
                variant="compact"
                icon={<HardDrives size={40} className="text-semantic-error" weight="duotone" />}
                title="Gagal Memuat Sumber"
                description="Server sedang sibuk. Silakan coba beberapa saat lagi."
                className="bg-surface-overlay rounded-xl border border-semantic-error/20 py-16"
              />
            ) : filteredSources.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={<HardDrives size={40} className="text-text-muted" weight="duotone" />}
                title="Tidak ada sumber yang cocok"
                description="Coba gunakan kata kunci pencarian yang lain."
                className="bg-surface-overlay rounded-xl border border-border-subtle border-dashed py-16"
              />
            ) : (
              <div className="space-y-4 pb-4">
                <div className="flex flex-col gap-3">
                  {filteredSources.map((source) => (
                    <SourceCard key={source.id} source={source} onUpdate={loadLocalSources} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile FAB removed as it is now next to search */}
        </YomirraSurface>
      </div>

      <AddCustomSourceSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onSuccess={loadLocalSources}
      />
    </DirectionalTransition>
  );
}
