"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";
import { HardDrives, ShieldWarning } from "@phosphor-icons/react";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { SourceCard } from "@/components/source/source-card";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useSettingsStore } from "@/shared/store/settings-store";
import { cn } from "@/shared/utils/cn";

export default function SourcesPage() {
  const isMounted = useMounted();
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const setHideNsfw = useSettingsStore(state => state.setHideNsfw);
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

  const { data: serverSources, isLoading, isError, refetch: refetchSources } = useQuery(sourceQueryOptions);

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
            lastChecked: "Baru saja",
            message: health.message,
          }
        };
      }
      return source;
    });
  }, [serverSources, localSources, healthStats]);

  const nsfwCount = React.useMemo(() => {
    return allSources.filter(s => s.isNsfw).length;
  }, [allSources]);

  const filteredSources = React.useMemo(() => {
    let result = allSources;
    if (isMounted && hideNsfw) {
      result = result.filter(s => !s.isNsfw);
    }
    
    if (!filter.trim()) return result;
    const lower = filter.toLowerCase();
    return result.filter(s => s.name.toLowerCase().includes(lower) || s.language?.toLowerCase().includes(lower));
  }, [allSources, filter, hideNsfw, isMounted]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <YomirraSurface variant="base" className="min-h-screen">
        <PageContainer hasMobileHeader>
          <PageHeader
            title="Sumber"
            subtitle="Pilih sumber yang digunakan untuk menjelajah dan membaca komik."
            icon={<HardDrives size={24} weight="duotone" />}
          />

          {/* Source Mental Model Guidance Banner */}
          <div className="p-3.5 rounded-2xl bg-surface-glass border border-border-subtle text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="leading-relaxed">
              Pilih sumber yang ingin tampil di Library dan Populer. Semua sumber tetap bisa digunakan lewat Cari.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SearchInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari sumber…"
              containerClassName="rounded-2xl max-w-md w-full"
            />
            {isMounted && nsfwCount > 0 ? (
              <button
                type="button"
                onClick={() => setHideNsfw(!hideNsfw)}
                className={cn(
                  "inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border px-3 py-2 text-xs transition-colors shrink-0",
                  hideNsfw
                    ? "border-border-subtle bg-surface-muted/60 text-text-muted hover:border-border-strong hover:text-text-primary"
                    : "border-semantic-error/40 bg-semantic-error/10 text-semantic-error font-semibold"
                )}
                title={hideNsfw ? "Tampilkan sumber 18+" : "Sembunyikan sumber 18+"}
              >
                <ShieldWarning size={16} weight={hideNsfw ? "regular" : "duotone"} />
                <span>{hideNsfw ? `18+ Disembunyikan (${nsfwCount})` : "18+ Ditampilkan"}</span>
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <SourceListSkeleton />
          ) : isError ? (
            <EmptyState
              variant="compact"
              icon={<HardDrives size={40} className="text-semantic-error" weight="duotone" />}
              title="Sumber gagal dimuat"
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
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSources.filter(s => s.status !== 'in-fix' && s.status !== 'in-dev').map((source) => (
                  <SourceCard key={source.id} source={source} onUpdate={loadLocalSources} />
                ))}
              </div>

              {filteredSources.some(s => s.status === 'in-fix') && (
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 px-1">Sedang Diperbaiki</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredSources.filter(s => s.status === 'in-fix').map((source) => (
                      <SourceCard key={source.id} source={source} onUpdate={loadLocalSources} />
                    ))}
                  </div>
                </div>
              )}

              {filteredSources.some(s => s.status === 'in-dev') && (
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 px-1">Dalam Pengembangan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredSources.filter(s => s.status === 'in-dev').map((source) => (
                      <SourceCard key={source.id} source={source} onUpdate={loadLocalSources} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </PageContainer>
      </YomirraSurface>
    </PullToRefresh>
  );
}
