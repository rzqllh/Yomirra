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
import { SearchInput } from "@/components/ui/search-input";
import { SourceCard } from "@/components/source/source-card";

import { DirectionalTransition } from "@/components/ui/directional-transition";

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
      <MobilePageShell title="Sumber" className="p-0 pb-6">
        <div className="bg-surface-base px-4 py-4 border-b border-border-subtle">
          <h1 className="text-xl font-bold tracking-tight text-text-primary mb-1">Sumber</h1>
          <p className="text-sm text-text-muted mb-4">Kelola sumber bacaan untuk Yomirra.</p>
          
          <SearchInput
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cari sumber..."
            containerClassName="focus-within:ring-2 focus-within:ring-accent/50"
            className="text-[15px]"
          />
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
                  <SourceCard key={source.id} source={source} />
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
    </DirectionalTransition>
  );
}
