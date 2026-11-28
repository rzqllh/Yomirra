"use client";

import * as React from "react";
import Link from "next/link";
import type {MetadataWork} from "@/shared/lib/metadata-catalog";
import { motion, LayoutGroup, useReducedMotion } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";
import { WarningCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { MangaGrid } from "@/components/komik/manga-grid";
import { ShelfCard } from "@/components/komik/card";
import { CompactCard } from "@/components/komik/card/compact-card";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { canonicalSourceKey, groupVerifiedCatalogEntries } from "@/shared/lib/canonical-identity";
import { getCanonicalSavedDetailHref } from "@/shared/lib/routes";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationNext10,
  PaginationPrevious10,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/shared/utils/cn";
import { useSearchFilterStore } from "@/shared/store/search-filter-store";
import type { SourceMetadata } from "@/shared/sources/source-types";
import { SearchSourceErrorSummary } from "./source-error-summary";

export interface SearchResultsProps {
  activeSelectedSources: string[];
  searchableSources: SourceMetadata[];
  errorsToDisplay: { sourceId: string; error: string }[];
  isInitialLoading: boolean;
  allSourcesFailed: boolean;
  searchMangas: { canonicalKey?: string; manga: any; sourceId: string; sourceBindings?: any[] }[];
  metadataOnly?:MetadataWork[];
  query: string;
  hasActiveFilters: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasNextPage: boolean;
  queryClient: any;
  hasSearchIntent: boolean;
}

export function SearchResults({
  activeSelectedSources,
  searchableSources,
  errorsToDisplay,
  isInitialLoading,
  allSourcesFailed,
  searchMangas,
  metadataOnly=[],
  query,
  hasActiveFilters,
  page,
  setPage,
  hasNextPage,
  queryClient,
  hasSearchIntent,
}: SearchResultsProps) {
  const sort = useSearchFilterStore((state) => state.sort);
  const reducedMotion = useReducedMotion();
  const listingViewMode = useSettingsStore((state) => state.listingViewMode);
  const savedLibraryMap = useLibraryStore((state) => state.items);
  const verifiedCatalogLookup = React.useMemo(() => {
    const index = new Map<string, string>();
    const groups = groupVerifiedCatalogEntries(Object.values(savedLibraryMap)
      .filter(item => item.isBookmarked !== false));
    for (const group of groups) {
      const representative = group.members.find(member => member.id) ?? group.members[0];
      const href = getCanonicalSavedDetailHref(
        representative.id ?? `${representative.sourceId}::${representative.mangaId}`
      );
      for (const ref of group.sourceBindings) {
        index.set(canonicalSourceKey(ref.sourceId, ref.mangaId), href);
      }
    }
    return index;
  }, [savedLibraryMap]);
  const canonicalHrefFor = (item: SearchResultsProps["searchMangas"][number]): string | undefined => {
    const refs = item.sourceBindings ?? item.manga?.sourceBindings ??
      [{ sourceId: item.sourceId, mangaId: item.manga.id }];
    return refs.map((ref: { sourceId: string; mangaId: string }) =>
      verifiedCatalogLookup.get(canonicalSourceKey(ref.sourceId, ref.mangaId))
    ).find(Boolean);
  };

  const headingTitle = React.useMemo(() => {
    if (query.trim().length > 0) {
      return "Hasil pencarian";
    }
    switch (sort) {
      case "popular":
        return "Populer";
      case "latest":
      case "update":
        return "Terbaru";
      case "rating":
        return "Rating tertinggi";
      case "title":
      case "alphabet":
      case "alphabetical":
        return "Judul (A-Z)";
      default:
        return "Populer";
    }
  }, [query, sort]);

  return (
    <>
      {/* Keep partial provider failures actionable without pushing healthy results below stacked banners. */}
      {!allSourcesFailed && (
        <SearchSourceErrorSummary
          errors={errorsToDisplay}
          sources={searchableSources}
        />
      )}

      {/* Content Area */}
      {isInitialLoading && searchMangas.length === 0 ? (
        <SearchResultSkeleton showControls={false} />
      ) : allSourcesFailed && searchMangas.length === 0 ? (
          <motion.div
            key="global-error"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.page}
            className="pt-8"
          >
            <EmptyState
              icon={<WarningCircle size={40} className="text-semantic-error" weight="duotone" />}
              title={
                activeSelectedSources.length === 1
                  ? `${
                      searchableSources.find((s) => s.id === activeSelectedSources[0])?.name ||
                      "Sumber"
                    } tidak dapat dimuat`
                  : "Pencarian gagal"
              }
              description={
                activeSelectedSources.length === 1
                  ? "Sumber ini tidak merespons. Coba lagi nanti."
                  : "Sumber yang dipilih tidak merespons. Coba lagi nanti."
              }
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    if (activeSelectedSources.length === 1) {
                      queryClient.invalidateQueries({
                        queryKey: ["searchSource", activeSelectedSources[0]],
                      });
                    } else {
                      queryClient.invalidateQueries({ queryKey: ["searchSource"] });
                    }
                  }}
                >
                  Coba lagi
                </Button>
              }
            />
          </motion.div>
        ) : metadataOnly.length > 0 && searchMangas.length === 0 ? null : activeSelectedSources.length === 0 ? (
          <motion.div
            key="no-source"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.page}
            className="pt-8"
          >
            <EmptyState
              icon={<WarningCircle size={40} className="text-accent" weight="duotone" />}
              title="Pilih sumber untuk mulai mencari"
              description="Aktifkan setidaknya satu sumber pencarian."
            />
          </motion.div>
        ) : !hasSearchIntent ? (
          <motion.div
            key="search-initial"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.page}
            className="pt-8"
          >
            <EmptyState
              icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
              title="Cari komik"
              description="Ketik judul atau kreator untuk mulai mencari."
            />
          </motion.div>
        ) : searchMangas.length > 0 ? (
          <motion.div
            key="results-grid"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.page}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2 text-text-primary tracking-tight">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                {headingTitle}
              </h2>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-xs font-semibold text-text-muted">
                  {searchMangas.length} {query.trim().length === 0 ? "judul" : "hasil"}
                </span>
              </div>
            </div>

            {isInitialLoading && <p role="status" className="text-xs text-text-secondary">Memuat sumber lainnya</p>}
            {searchMangas.some(item => item.canonicalKey?.startsWith("metadata:mangabaka:")) && (
              <p className="text-xs text-text-secondary">Pencocokan judul: <a className="text-accent underline" href="https://mangabaka.org/">MangaBaka</a> (<a className="underline" href="https://mangabaka.org/about/data-license">lisensi</a>). Hasil diadaptasi untuk katalog.</p>
            )}
            <LayoutGroup id="search-listing-cards">
              <MangaGrid viewMode={listingViewMode}>
                {searchMangas.map((item, index) =>
                  listingViewMode === "compact" ? (
                    <CompactCard
                      key={item.canonicalKey ?? JSON.stringify([item.sourceId, item.manga.id])}
                      sourceId={item.sourceId}
                      manga={item.manga}
                      sourceBindings={item.sourceBindings || (item.manga as any)?.sourceBindings}
                      canonicalDetailHref={canonicalHrefFor(item)}
                      showSourceBadge={true}
                      priority={false}
                      index={index}
                      animateReveal={true}
                    />
                  ) : (
                    <ShelfCard
                      key={item.canonicalKey ?? JSON.stringify([item.sourceId, item.manga.id])}
                      sourceId={item.sourceId}
                      manga={item.manga}
                      sourceBindings={item.sourceBindings || (item.manga as any)?.sourceBindings}
                      canonicalDetailHref={canonicalHrefFor(item)}
                      showSourceBadge={true}
                      priority={false}
                      index={index}
                      animateReveal={true}
                    />
                  )
                )}
              </MangaGrid>
            </LayoutGroup>

            {/* Pagination */}
            <div className="mt-8 py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious10
                      onClick={() => setPage((p) => Math.max(1, p - 10))}
                      className={cn(page <= 10 && "opacity-50 pointer-events-none")}
                      aria-disabled={page <= 10}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={cn(page === 1 && "opacity-50 pointer-events-none")}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {page > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    </>
                  )}

                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(page - 1)}>{page - 1}</PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>

                  {hasNextPage && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(page + 1)}>{page + 1}</PaginationLink>
                    </PaginationItem>
                  )}

                  {hasNextPage && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => p + 1)}
                      className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                      aria-disabled={!hasNextPage}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext10
                      onClick={() => setPage((p) => p + 10)}
                      className={cn(!hasNextPage && "opacity-50 pointer-events-none")}
                      aria-disabled={!hasNextPage}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search-empty"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.page}
            className="pt-8"
          >
            <EmptyState
              icon={<MagnifyingGlass size={40} className="text-text-muted" weight="duotone" />}
              title={
                hasActiveFilters
                  ? "Tidak ada komik yang cocok dengan filter"
                  : query.length > 0
                  ? "Tidak ada komik yang ditemukan"
                  : "Tidak ada komik ditemukan"
              }
              description={
                hasActiveFilters
                  ? "Coba kurangi atau ubah filter."
                  : query.length > 0
                  ? "Coba gunakan kata kunci lain."
                  : "Pilih sumber lain untuk menampilkan komik."
              }
            />
          </motion.div>
        )}

      {metadataOnly.length>0&&<section className="mt-8 space-y-3" aria-label="Katalog metadata">
        <h2 className="text-base font-bold text-text-primary">Judul dari katalog metadata</h2>
        <p className="text-xs text-text-secondary">Sumber bacaan belum terverifikasi. Data: <a className="underline" href="https://mangabaka.org/">MangaBaka</a> · <a className="underline" href="https://mangabaka.org/about/data-license">Lisensi</a>.</p>
        {metadataOnly.map(work=><Link key={work.externalId} prefetch={false} href={`/catalog/metadata/${work.externalId}`} className="block rounded-lg border border-border-subtle p-3 hover:bg-surface-hover"><span className="font-semibold text-text-primary">{work.title}</span><span className="block text-xs text-text-secondary">{work.format}{work.authors?.length?` · ${work.authors.join(", ")}`:""}</span></Link>)}
      </section>}
    </>
  );
}
