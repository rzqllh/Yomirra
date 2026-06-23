import { Metadata } from "next";
import { DesktopPageTitle } from "@/components/app/header";
import { Fire } from "@phosphor-icons/react/dist/ssr";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { Suspense } from "react";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
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
        {popular.mangas.slice(0, 15).map((manga, index) => (
          <div key={manga.id} className="w-full">
            <MangaCard 
              manga={{ ...manga, rank: index + 1 }} 
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
      <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <DesktopPageTitle 
            title="Manga Populer" 
            description="Manga, Manhwa, dan Manhua paling populer saat ini."
            icon={<Fire size={32} weight="duotone" />}
          />
        </div>
        
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
