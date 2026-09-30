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
import { Fire } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Manga Populer - Yomirra",
  description: "Manga, Manhwa, dan Manhua paling populer saat ini.",
};

async function PopularFeed({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  let popular: any;
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    popular = await withCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY);
  } catch (_error) {
    return null;
  }

  if (!popular?.mangas.length) return null;

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
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
  const disabledSourcesCookie = cookieStore.get("yomirra-disabled-sources")?.value;
  let userDisabledSources: string[] = [];

  if (disabledSourcesCookie) {
    try {
      userDisabledSources = JSON.parse(decodeURIComponent(disabledSourcesCookie));
    } catch (_e) {}
  }

  const allRuntime = await getRuntimeSources();
  const activeSources = allRuntime.filter(
    (s) =>
      s.isEnabled &&
      s.isInstalled &&
      s.status !== "unavailable" &&
      !userDisabledSources.includes(s.id)
  );

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Populer"
          subtitle="Manga, Manhwa, dan Manhua paling populer saat ini."
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
