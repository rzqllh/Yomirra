"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MagnifyingGlass, Plug, HardDrives } from "@phosphor-icons/react";
import Image from "next/image";
import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { SourceListSkeleton } from "@/components/skeletons/source-list-skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";

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
    <MobilePageShell title="Sumber" className="p-0 pb-6">
      <div className="bg-surface-base px-4 py-4 border-b border-border-subtle">
        <h1 className="text-xl font-bold tracking-tight text-text-primary mb-1">Sumber</h1>
        <p className="text-sm text-text-muted mb-4">Kelola sumber bacaan untuk Yomirra.</p>
        
        <div className="flex items-center gap-3 rounded-full bg-surface-raised px-4 py-2.5 transition-all duration-[var(--motion-fast)] focus-within:bg-surface-overlay focus-within:ring-2 focus-within:ring-accent/50 border border-border-subtle">
          <MagnifyingGlass className="size-5 text-text-muted shrink-0" weight="bold" />
          <input 
            type="text" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cari sumber..." 
            className="flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <SourceListSkeleton />
        ) : filteredSources.length === 0 ? (
          <EmptyState
            variant="compact"
            icon={<HardDrives size={40} className="text-text-muted" weight="duotone" />}
            title="Tidak ada sumber yang cocok."
            description="Coba kata kunci lain."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {filteredSources.map((source) => (
                <div key={source.id} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 transition-all hover:bg-surface-overlay">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-background border border-border-subtle">
                      {source.icon ? (
                        <Image src={source.icon} alt={source.name} width={28} height={28} className="rounded-sm" />
                      ) : (
                        <Plug size={24} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate text-[15px] font-bold text-text-primary">{source.name}</h3>
                        <Badge variant={source.status === "online" ? "success" : "warning"}>
                          <div className="size-1.5 rounded-full bg-current mr-1" />
                          {source.status === "online" ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <p className="truncate text-[13px] text-text-muted flex items-center gap-2 mt-0.5">
                        <span className="uppercase">{source.language || "EN"}</span>
                        <span>•</span>
                        <span>v{source.version}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(source.capabilities).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <Badge key={key} variant="muted">
                          {key}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {sources?.length === 1 && (
              <div className="text-center mt-8">
                <p className="text-xs text-text-muted font-medium bg-surface-raised px-4 py-2 rounded-full inline-block">
                  Hanya satu sumber yang terinstal saat ini.
                </p>
                <p className="text-[11px] text-text-muted mt-4 max-w-xs mx-auto">
                  Pembuatan sumber kustom membutuhkan skema adapter yang didukung. Versi ini hanya mendukung adapter bawaan.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MobilePageShell>
  );
}
