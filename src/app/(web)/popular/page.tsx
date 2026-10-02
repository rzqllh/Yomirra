import { Metadata } from "next";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { Suspense } from "react";
import { PopularFeedSkeleton } from "@/components/skeletons/popular-skeleton";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { EditorialCard } from "@/components/manga/card";
import Link from "next/link";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { cookies } from "next/headers";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
import { Fire, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { parseDisabledSourceIdsCookie, selectDiscoverySources } from "@/shared/sources/discovery-source-policy";

export const metadata: Metadata = {
  title: "Komik Populer — Yomirra",
  description: "Komik yang sedang populer dari sumber aktif.",
};

async function PopularFeed({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  let popular: any;
  let loadFailed = false;

  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    popular = await withCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY);
  } catch (_error) {
    loadFailed = true;
  }

  if (loadFailed || !popular?.mangas?.length) {
    return (
      <section className="mb-8 rounded-2xl border border-border-subtle bg-surface-raised p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0 text-text-muted" />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text-primary">{sourceName}</h2>
            <p className="mt-1 text-sm text-text-muted">
              {loadFailed
                ? "Data populer dari sumber ini belum bisa dimuat."
                : "Belum ada data populer dari sumber ini."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          {sourceName}
        </h2>
        <Link href={`/sources/${sourceId}?sort=popular`} className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
          Lihat Semua
        </Link>
      </div>
      
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {popular.mangas.slice(0, 15).map((manga: any, index: number) => (
          <div key={manga.id} className="w-full">
            <EditorialCard 
              manga={{ ...manga, rank: index + 1 }} 
              rank={index + 1}
              sourceId={sourceId} 
              priority={index < 4}
              index={index}
              animateReveal={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function PopularPage() {
  const cookieStore = await cookies();
  const userDisabledSources = parseDisabledSourceIdsCookie(
    cookieStore.get("yomirra-disabled-sources")?.value
  );

  const allRuntime = await getRuntimeSources();
  const activeSources = selectDiscoverySources(
    allRuntime,
    userDisabledSources
  );

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Populer"
          subtitle="Komik yang sedang populer dari sumber aktif."
          icon={<Fire size={24} weight="duotone" />}
          hideDesktop
        />

        <h1 className="sr-only">Populer</h1>
        
        {activeSources.map(source => (
          <Suspense key={source.id} fallback={<PopularFeedSkeleton />}>
            <PopularFeed sourceId={source.id} sourceName={source.name} />
          </Suspense>
        ))}
        
        {activeSources.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-text-muted">Tidak ada sumber komik yang aktif.</p>
          </div>
        )}
      </PageContainer>
    </YomirraSurface>
  );
}
