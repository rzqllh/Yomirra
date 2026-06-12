import { Metadata } from "next";
import { TopBar } from "@/components/app/top-bar";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { Suspense } from "react";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Manga Populer - Yomirra",
  description: "Manga, Manhwa, dan Manhua paling populer saat ini.",
};

async function PopularFeed({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  try {
    const source = sourceManager.getSource(sourceId);
    const popular = await swrCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY);

    if (!popular?.mangas.length) return null;

    // eslint-disable-next-line react-hooks/error-boundaries
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
        
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {popular.mangas.slice(0, 15).map((manga, index) => (
            <div key={manga.id} className="w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] shrink-0 snap-start ">
              <MangaCard 
                manga={manga} 
                sourceId={sourceId} 
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      </section>
    );
  } catch (_error) {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function PopularPage() {
  const activeSources = sourceRegistry.filter(s => s.isEnabled && s.isInstalled);

  return (
    <main className="min-h-screen bg-surface-base">
      <TopBar title="Manga Populer" />
      
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-8 md:hidden">Manga Populer</h1>
        
        {activeSources.map(source => (
          <Suspense key={source.id} fallback={<SourceFeedSkeleton />}>
            <PopularFeed sourceId={source.id} sourceName={source.name} />
          </Suspense>
        ))}
        
        {activeSources.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-text-muted">Tidak ada sumber komik yang aktif.</p>
          </div>
        )}
      </div>
    </main>
  );
}
