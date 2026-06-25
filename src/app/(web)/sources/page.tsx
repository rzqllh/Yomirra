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
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useSettingsStore } from "@/shared/store/settings-store";

export default function SourcesPage() {
  const isMounted = useMounted();
  const isGodMode = useSettingsStore(state => state.isGodMode);
  const [filter, setFilter] = React.useState("");
  const [localSources, setLocalSources] = React.useState<import("@/shared/sources/source-types").SourceMetadata[]>([]);

  // Load custom sources from localStorage on mount
  const loadLocalSources = React.useCallback(() => {
    setLocalSources(dynamicSourceRegistry.getAll());
  }, []);

  React.useEffect(() => {
    loadLocalSources();

    const handleUpdate = () => loadLocalSources();
    window.addEventListener("sources_updated", handleUpdate);
    return () => window.removeEventListener("sources_updated", handleUpdate);
  }, [loadLocalSources]);

  const { data: serverSources, isLoading, isError, refetch: refetchSources } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const { data: healthStats, refetch: refetchHealth } = useQuery({
    queryKey: ["sources-health"],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 60000, // Refetch every 1 minute
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchSources(),
      refetchHealth()
    ]);
  };

  const allSources = React.useMemo(() => {
    const s = [...(serverSources || [])];
    // Merge local sources
    localSources.forEach(ls => {
      if (!s.find(x => x.id === ls.id)) {
        s.push(ls);
      }
    });

    // Merge health stats
    return s.map(source => {
      const health = healthStats?.[source.id];
      if (health) {
        return {
          ...source,
          status: health.status as any,
          healthStats: {
            latency: health.latency,
            uptime: health.uptime,
            lastChecked: "Just now",
            message: health.message,
          }
        };
      }
      return source;
    });
  }, [serverSources, localSources, healthStats]);

  const filteredSources = React.useMemo(() => {
    let result = allSources;
    if (isMounted && !isGodMode) {
      result = result.filter(s => !s.isNsfw);
    }
    
    if (!filter.trim()) return result;
    const lower = filter.toLowerCase();
    return result.filter(s => s.name.toLowerCase().includes(lower) || s.language?.toLowerCase().includes(lower));
  }, [allSources, filter, isGodMode, isMounted]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
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
            </div>

            <div className="md:hidden flex gap-2 px-4 py-4 pb-2 border-b border-border-subtle bg-surface-base sticky top-[calc(var(--mobile-header-height)+var(--safe-top))] z-[var(--z-sticky)]">
              <div className="flex-1">
                <SearchInput
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Cari sumber terinstall..."
                />
              </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      </DirectionalTransition>
    </PullToRefresh>
  );
}
