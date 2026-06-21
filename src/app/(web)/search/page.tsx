"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MagnifyingGlass, WarningCircle, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/yomirra-header";
import { useSearchParams } from "next/navigation";
import { MangaCard } from "@/components/manga/manga-card";
import { motion, AnimatePresence } from "motion/react";
import { useSettingsStore } from "@/shared/store/settings-store";

import { YomirraSearchField } from "@/components/ui/yomirra-search-field";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  return (
    <DirectionalTransition>
      <React.Suspense fallback={
        <main className="min-h-screen bg-surface-base">
          <YomirraPageHeader title="" showBack variant="transparent" />
          <div className="px-4 py-6">
            <SearchResultSkeleton />
          </div>
        </main>
      }>
        <SearchContent />
      </React.Suspense>
    </DirectionalTransition>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const [localQuery, setLocalQuery] = React.useState(query);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("q", localQuery.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: () => apiClient.getSources(),
  });

  const searchableSources = (sourcesData || []).filter(s => s.isInstalled && s.capabilities.search);
  
  const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  React.useEffect(() => {
    let mounted = true;
    if (searchableSources.length > 0 && !isInitialized) {
      setTimeout(() => {
        if (mounted) {
          setSelectedSources(searchableSources.map(s => s.id));
          setIsInitialized(true);
        }
      }, 0);
    }
    return () => { mounted = false; };
  }, [searchableSources, isInitialized]);

  const toggleSource = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const isNsfwFiltered = useSettingsStore((state) => state.hideNsfw);

  const { data: searchResponse, isLoading, error } = useQuery({
    queryKey: ["searchGlobal", query, selectedSources, isNsfwFiltered],
    queryFn: () => apiClient.searchGlobal(query, selectedSources, isNsfwFiltered),
    enabled: query.length > 0 && selectedSources.length > 0,
  });

  return (
    <main className="min-h-screen bg-surface-base">
      <YomirraPageHeader title="" showBack variant="transparent" />
      
      <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <DesktopPageTitle 
            title={query ? `Pencarian: ${query}` : "Pencarian"} 
            description="Pilih sumber untuk mencari manga favoritmu."
            icon={<MagnifyingGlass size={32} weight="duotone" />}
          />
        </div>

        <div className="mb-6">
          <YomirraSearchField 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onSubmitAction={handleSearch}
            placeholder="Cari komik favoritmu..."
            containerClassName="w-full h-14"
            autoFocus
          />
        </div>

        {/* Source Filter Chips */}
        <div className="mb-8 flex flex-wrap gap-3">
          <AnimatePresence>
            {searchableSources.map(source => {
              const isSelected = selectedSources.includes(source.id);
              return (
                <motion.button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all outline-none overflow-hidden ${ isSelected ? "-accent text-background" : "--glass bg-surface-glass backdrop-blur-md text-text-muted hover:--strong hover:bg-surface-glass/80 -[0_4px_16px_rgba(0,0,0,0.05)] dark:-[0_4px_16px_rgba(0,0,0,0.2)]"}`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId={`active-filter-${source.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-accent z-0"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isSelected && <CheckCircle weight="fill" size={16} />}
                    {source.name}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Content States */}
        {query.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-glass backdrop-blur-md rounded-2xl --glass -[0_4px_16px_rgba(0,0,0,0.05)] dark:-[0_4px_16px_rgba(0,0,0,0.2)]">
            <MagnifyingGlass size={48} className="mb-4 text-text-muted" weight="duotone" />
            <p className="text-base font-medium text-text-primary">Masukkan kata kunci untuk mencari.</p>
          </div>
        ) : selectedSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
            <WarningCircle size={48} className="mb-4 text-accent" weight="duotone" />
            <p className="text-base font-medium text-text-primary">Tidak ada sumber yang dipilih.</p>
            <p className="text-sm text-text-muted mt-1">Pilih setidaknya satu sumber di atas.</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-10">
            <SearchResultSkeleton />
            <SearchResultSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
            <WarningCircle size={48} className="mb-4 text-semantic-error" weight="duotone" />
            <p className="text-base font-medium text-text-primary">Terjadi kesalahan pencarian.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {Object.entries(searchResponse?.resultsBySource || {}).map(([sId, res]) => {
              const sourceInfo = searchableSources.find(s => s.id === sId);
              const sourceName = sourceInfo?.name || sId;
              
              if (!res.results || res.results.length === 0) {
                return (
                  <div key={sId} className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-border-strong"></span>
                      {sourceName}
                    </h2>
                    <p className="text-sm text-text-muted italic bg-surface-raised/50 p-4 rounded-md border border-border-subtle">
                      Tidak ada hasil ditemukan.
                    </p>
                  </div>
                );
              }

              return (
                <div key={sId} className="flex flex-col gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    {sourceName}
                    <span className="text-sm text-text-muted font-normal ml-2">
                      ({res.results.length} judul)
                    </span>
                  </h2>
                  <motion.div layout className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                    <AnimatePresence mode="popLayout">
                      {res.results.map((manga) => (
                        <motion.div
                          key={manga.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <MangaCard 
                            sourceId={sId}
                            manga={manga}
                            priority={false}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
