"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { PageHeader } from "@/components/chrome/header";
import { ShelfCard } from "@/components/komik/card";
import { MangaGridSkeleton } from "@/components/komik/manga-grid-skeleton";
import { useSearchParams } from "next/navigation";
import { WarningCircle, Compass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useAuth } from "@/shared/hooks/use-auth";
import { useCatalogBrowserReady } from "@/shared/hooks/use-catalog-browser-ready";
import { useVerifiedAge } from "@/shared/hooks/use-verified-age";
import { isContentVisible, isSourceContentVisible, sourceReadScope } from "@/shared/sources/content-policy";
import { isDiscoverySourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { sourceQueryOptions } from "@/shared/sources/source-query-options";
import type { SourceMetadata } from "@/shared/sources/source-types";
import { useSettingsStore } from "@/shared/store/settings-store";
import { House } from "@phosphor-icons/react/dist/ssr";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export const dynamic = "force-dynamic";

export default function SourceBrowsePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const unwrappedParams = React.use(params);
  const sourceId = unwrappedParams.sourceId;
  const searchParams = useSearchParams();
  const sort = searchParams?.get("sort") === "popular" ? "popular" : "latest";
  const pageStr = searchParams?.get("page") || "1";
  const currentPage = parseInt(pageStr, 10) || 1;

  const { user } = useAuth();
  const verifiedAge = useVerifiedAge(user);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const preferredLanguages = useSettingsStore((state) => state.preferredLanguages);
  const dataSaver = useSettingsStore((state) => state.dataSaver);
  const effectiveHideNsfw = hideNsfw || verifiedAge !== "verified";
  const browserReady = useCatalogBrowserReady();
  const [localSources, setLocalSources] = React.useState<SourceMetadata[] | null>(
    () => browserReady ? dynamicSourceRegistry.getAll() : null
  );
  const [restrictedServerIds, setRestrictedServerIds] = React.useState(() => new Set<string>());

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLocalSources = () => setLocalSources(dynamicSourceRegistry.getAll());
    loadLocalSources();
    window.addEventListener("sources_updated", loadLocalSources);
    return () => window.removeEventListener("sources_updated", loadLocalSources);
  }, []);

  const { data: serverSource, status: sourceStatus } = useQuery({
    ...sourceQueryOptions,
    select: (sources) => sources.find((source) => source.id === sourceId) ?? null,
  });
  const wasRestrictedOnServer = restrictedServerIds.has(sourceId);
  if (serverSource && (serverSource.isNsfw === true) !== wasRestrictedOnServer) {
    // A safe-mode registry response can omit this ID without releasing its server identity.
    const next = new Set(restrictedServerIds);
    if (serverSource.isNsfw === true) next.add(sourceId);
    else next.delete(sourceId);
    setRestrictedServerIds(next);
  }

  const hasServerIdentity = serverSource != null || wasRestrictedOnServer;
  const localSource = localSources?.find((source) => source.id === sourceId);
  const resolvedSource = hasServerIdentity ? serverSource : sourceStatus !== "pending" ? localSource : undefined;
  const sourceInfo = resolvedSource && isDiscoverySourceSystemEligible(resolvedSource) &&
    isSourceContentVisible(resolvedSource, effectiveHideNsfw)
    ? resolvedSource
    : undefined;
  const isMissing = !sourceInfo && (serverSource != null || (wasRestrictedOnServer && effectiveHideNsfw) ||
    (sourceStatus === "success" && localSources !== null));
  const hasSourceError = !sourceInfo && sourceStatus === "error" && localSources !== null;
  const provider = hasServerIdentity ? "server" : "browser";
  const manifestUrl = hasServerIdentity ? null : localSource?.manifestUrl ?? null;
  const catalogScope = [
    "sourceBrowse", sourceId, provider, manifestUrl, sort,
    sourceReadScope({ hideNsfw: effectiveHideNsfw, preferredLanguages, dataSaver }),
  ];

  const {
    data,
    status
  } = useQuery({
    queryKey: [...catalogScope, currentPage],
    queryFn: async () => {
      const catalog = await (sort === "popular"
        ? apiClient.getPopular(sourceId, currentPage, { manifestUrl })
        : apiClient.getLatest(sourceId, currentPage, { manifestUrl }));
      if (!effectiveHideNsfw) return catalog;
      return { ...catalog, mangas: catalog.mangas.filter((manga) => isContentVisible(manga)) };
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery && catalogScope.every((part, index) => part === previousQuery.queryKey[index])
        ? previousData
        : undefined,
    refetchOnMount: true,
    enabled: !!sourceInfo,
  });

  const sourceName = sourceInfo?.name || "Sumber";

  const { isSourceHiddenFromHome, toggleHomeSource } = useSourcePreferencesStore();
  const isHiddenFromHome = isSourceHiddenFromHome(sourceId);

  return (
    <Surface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title={sourceName}
          subtitle="Jelajahi komik dari sumber ini."
          showBack
          backHref="/sources"
          backBehavior="parent"
          hideDesktop
        />
        <Button asChild variant="secondary" className="hidden self-start md:inline-flex">
          <Link href="/sources">
            <CaretLeft aria-hidden="true" />
            Kembali ke Sumber
          </Link>
        </Button>
        {sourceInfo && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/70 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <House size={24} weight="regular" />
              </div>
              <div>
                <p className="font-bold text-text-primary">Tampilkan di Beranda</p>
                <p className="text-xs text-text-muted">Sertakan komik dari sumber ini di rekomendasi Beranda.</p>
              </div>
            </div>
            <ToggleSwitch
              checked={!isHiddenFromHome}
              onCheckedChange={() => toggleHomeSource(sourceId)}
              label="Tampilkan di Beranda"
            />
          </div>
        )}

        {isMissing ? (
          <p className="py-20 text-center text-text-primary">Sumber tidak ditemukan.</p>
        ) : hasSourceError ? (
          <p role="alert" className="py-20 text-center text-text-primary">Gagal memuat daftar sumber. Coba lagi nanti.</p>
        ) : !sourceInfo || status === "pending" ? (
          <MangaGridSkeleton
            count={12}
            className="gap-y-6 sm:gap-y-8 md:gap-y-10"
          />
        ) : status === "error" ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
            <WarningCircle size={48} className="mb-4 text-semantic-error" weight="duotone" />
            <p className="text-base font-medium text-text-primary">Gagal memuat data dari {sourceName}.</p>
            <p className="text-sm text-text-muted mt-1">Sumber ini sedang tidak dapat dimuat. Coba lagi nanti.</p>
          </div>
        ) : data?.mangas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
            <Compass size={48} className="mb-4 text-text-muted" weight="duotone" />
            <p className="text-base font-medium text-text-primary">Belum ada komik yang ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10 lg:grid-cols-5 xl:grid-cols-6 flex-1 content-start">
              {data.mangas.map((manga) => (
                <ShelfCard
                  key={manga.id}
                  manga={manga}
                  sourceId={sourceId}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-10 flex items-center justify-center gap-4 py-4">
              <Link
                href={`/sources/${sourceId}?sort=${sort}&page=${Math.max(1, currentPage - 1)}`}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                  currentPage <= 1
                    ? "opacity-50 pointer-events-none bg-surface-raised text-text-muted"
                    : "bg-surface-glass border border-border-subtle text-text-primary hover:bg-surface-glass/80"
                )}
                aria-disabled={currentPage <= 1}
              >
                Sebelumnya
              </Link>
              <div className="px-4 py-2 rounded-xl bg-accent text-accent-on font-bold text-sm min-w-10 text-center">
                {currentPage}
              </div>
              <Link
                href={`/sources/${sourceId}?sort=${sort}&page=${currentPage + 1}`}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                  !data?.hasNextPage
                    ? "opacity-50 pointer-events-none bg-surface-raised text-text-muted"
                    : "bg-surface-glass border border-border-subtle text-text-primary hover:bg-surface-glass/80"
                )}
                aria-disabled={!data?.hasNextPage}
              >
                Selanjutnya
              </Link>
            </div>
          </>
        )}
      </PageContainer>
    </Surface>
  );
}
