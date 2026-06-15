"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { HardDrives } from "@phosphor-icons/react";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { SourceCard } from "@/components/source/source-card";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { YomirraSurface } from "@/components/ui/yomirra-layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/yomirra-header";

export default function SourcesPage() {
  const [filter, setFilter] = React.useState("");

  const { data: sources, isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const filteredSources = React.useMemo(() => {
    if (!sources) return [];
    if (!filter.trim()) return sources;
    const lower = filter.toLowerCase();
    return sources.filter(s => s.name.toLowerCase().includes(lower) || s.language?.toLowerCase().includes(lower));
  }, [sources, filter]);

  return (
    <DirectionalTransition>
      <div className="flex flex-col min-h-screen">
        <div className="md:hidden">
          <YomirraPageHeader title="Sumber" variant="auto" />
        </div>

        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
          <div className="hidden md:block px-4 py-8 pb-4">
            <DesktopPageTitle 
              title="Sumber" 
              description="Kelola sumber bacaan untuk Yomirra."
              icon={<HardDrives size={32} weight="duotone" />}
            />
          </div>

          <div className="md:hidden px-4 py-4 pb-2 border-b border-border-subtle bg-surface-base sticky top-[calc(var(--mobile-header-height)+var(--safe-top))] z-[var(--z-sticky)]">
            <SearchInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari sumber..."
              placeholder="Cari sumber terinstall..."
            />
          </div>

          <div className="hidden md:block px-4 pb-6">
            <SearchInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari sumber..."
              placeholder="Cari sumber manga..."
            />
          </div>

          <div className="p-4 pt-4">
            {isLoading ? (
              <SourceListSkeleton />
            ) : filteredSources.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={<HardDrives size={40} className="text-text-muted" weight="duotone" />}
                title="Tidak ada sumber yang cocok"
                description="Coba gunakan kata kunci pencarian yang lain."
                className="bg-surface-overlay rounded-xl border border-border-subtle border-dashed py-16"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {filteredSources.map((source) => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </div>

                {sources?.length === 1 && (
                  <div className="text-center mt-12 py-8 bg-surface-raised rounded-xl border border-border-subtle">
                    <p className="text-sm text-text-primary font-bold">
                      Hanya satu sumber yang terinstal saat ini.
                    </p>
                    <p className="text-xs text-text-muted mt-2 max-w-sm mx-auto px-4">
                      Pembuatan sumber kustom membutuhkan skema adapter yang didukung. Versi ini hanya mendukung adapter bawaan.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </YomirraSurface>
      </div>
    </DirectionalTransition>
  );
}
