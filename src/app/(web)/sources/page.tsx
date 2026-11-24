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
import { PrivateBetaPanel } from "@/components/source/private-beta-panel";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { DestinationHeader } from "@/components/chrome/header";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useAuth } from "@/shared/hooks/use-auth";
import { useVerifiedAge } from "@/shared/hooks/use-verified-age";
import { cn } from "@/shared/utils/cn";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { isSourceActiveForDisplay, sortSourcesForDisplay } from "@/shared/sources/source-sort";

const HEALTH_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export default function SourcesPage() {
  const isMounted = useMounted();
  const { user } = useAuth();
  const verifiedAge = useVerifiedAge(user);
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const setHideNsfw = useSettingsStore(state => state.setHideNsfw);
  const disabledSources = useSourcePreferencesStore(state => state.disabledSources);
  const disabledSourceIds = React.useMemo(() => new Set(disabledSources), [disabledSources]);
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
    // Server health snapshots have a ten-minute cache lifetime. Polling
    // every minute provides no additional evidence and consumes quota.
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
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
      if (source.maintenance) return { ...source, status: "in-fix" as const };
      if (health) {
        const observedAt = Date.parse(health.checkedAt || "");
        const isFresh = Number.isFinite(observedAt)
          && observedAt <= Date.now()
          && Date.now() - observedAt <= HEALTH_MAX_AGE_MS;
        return {
          ...source,
          status: isFresh ? health.status : "unknown" as const,
          healthStats: {
            latency: isFresh ? health.latency : "-",
            uptime: isFresh ? health.uptime : "-",
            lastChecked: Number.isFinite(observedAt) ? new Date(observedAt).toLocaleString("id-ID") : "Belum diperiksa",
            message: isFresh ? health.message : "Belum ada pemeriksaan terbaru. Status sumber belum dapat dipastikan.",
          }
        };
      }
      return { ...source, status: ["unavailable", "in-fix", "in-dev"].includes(source.status ?? "") ? source.status : "unknown" as const, healthStats: { latency: "-", uptime: "-", lastChecked: "Belum diperiksa", message: "Status sumber belum diperiksa." } };
    });
  }, [serverSources, localSources, healthStats]);

  const nsfwCount = React.useMemo(() => {
    return allSources.filter(s => s.isNsfw).length;
  }, [allSources]);

  const filteredSources = React.useMemo(() => {
    let result = allSources;
    if (!isMounted || hideNsfw || verifiedAge !== "verified") {
      result = result.filter(s => !s.isNsfw);
    }

    if (filter.trim()) {
      const lower = filter.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(lower) || s.language?.toLowerCase().includes(lower));
    }
    return sortSourcesForDisplay(result, disabledSourceIds);
  }, [allSources, filter, hideNsfw, verifiedAge, isMounted, disabledSourceIds]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <Surface variant="base" className="min-h-screen">
        <PageContainer variant="management" hasMobileHeader>
          <DestinationHeader destination="sources" />

          {/* Source Mental Model Guidance Banner */}
          <div className="p-3.5 rounded-xl bg-surface-glass border border-border-subtle text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="leading-relaxed">
              Sumber nonaktif tidak dipakai di Beranda, Jelajah, dan Populer. Kamu tetap bisa memilihnya secara manual saat mencari.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SearchInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari sumber…"
              containerClassName="rounded-xl max-w-md w-full"
            />
            {isMounted && verifiedAge === "verified" && !hideNsfw && nsfwCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setHideNsfw(true);
                  void fetch("/api/auth/adult-session", { method: "DELETE" }).catch(() => undefined);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border px-3 py-2 text-xs transition-colors shrink-0",
                  hideNsfw
                    ? "border-border-subtle bg-surface-muted/60 text-text-muted hover:border-border-strong hover:text-text-primary"
                    : "border-semantic-error/40 bg-semantic-error/10 text-semantic-error font-semibold"
                )}
                title="Sembunyikan sumber 18+"
              >
                <ShieldWarning size={16} weight={hideNsfw ? "regular" : "regular"} />
                <span>18+ Ditampilkan</span>
              </button>
            ) : null}
          </div>

          {isMounted && user && <PrivateBetaPanel key={user.uid} user={user} />}

          {isLoading ? (
            <SourceListSkeleton />
          ) : isError ? (
            <EmptyState
              variant="compact"
              icon={<HardDrives size={40} className="text-semantic-error" weight="duotone" />}
              title="Sumber gagal dimuat"
              description="Daftar sumber belum bisa dimuat. Coba lagi nanti."
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
              {filteredSources.some(s => isSourceActiveForDisplay(s, disabledSourceIds)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSources.filter(s => isSourceActiveForDisplay(s, disabledSourceIds)).map(source => (
                    <SourceCard key={source.id} source={source} onUpdate={loadLocalSources} />
                  ))}
                </div>
              )}
              {filteredSources.some(s => !isSourceActiveForDisplay(s, disabledSourceIds)) && (
                <section className="pt-2" aria-label="Sumber nonaktif">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 px-1">Nonaktif</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredSources.filter(s => !isSourceActiveForDisplay(s, disabledSourceIds)).map(source => (
                      <SourceCard key={source.id} source={source} onUpdate={loadLocalSources} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </PageContainer>
      </Surface>
    </PullToRefresh>
  );
}
