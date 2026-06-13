import { Metadata } from "next";
import { YomirraPageHeader } from "@/components/app/yomirra-header";
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
  let popular;
  try {
    const source = sourceManager.getSource(sourceId);
    popular = await swrCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY);
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
      
      <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 w-full min-w-0 snap-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {popular.mangas.slice(0, 15).map((manga, index) => (
          <div key={manga.id} className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0 snap-start ">
            <MangaCard 
              manga={manga} 
              sourceId={sourceId} 
              priority={index < 4}
              variant="editorial"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function PopularPage() {
  const activeSources = sourceRegistry.filter(s => s.isEnabled && s.isInstalled);

  return (
    <main className="min-h-screen bg-surface-base">
      <YomirraPageHeader title="Manga Populer" variant="auto" />
      
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary mb-8">Manga Populer</h1>
        
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
