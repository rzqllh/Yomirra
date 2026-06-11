import * as React from "react"
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { sourceManager } from "@/server/lib/sources/source-manager";

interface SourceFeedProps {
  sourceId: string;
  sourceName: string;
}

export async function SourceFeed({ sourceId, sourceName }: SourceFeedProps) {
  try {
    const source = sourceManager.getSource(sourceId);

    // Fetch on server in parallel
    const [popular, latest] = await Promise.all([
      swrCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY),
      swrCache(`source:${sourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY),
    ]);

    if (!popular?.mangas.length && !latest?.mangas.length) {
      return null;
    }

    return (
      <div className="space-y-10 pt-4 border-t border-border-subtle/30 first:pt-0 first:border-t-0">
        {/* Popular Section */}
        {popular && popular.mangas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                Populer di {sourceName}
              </h2>
              <Link href={`/sources/${sourceId}?sort=popular`} className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
                Lihat Semua
              </Link>
            </div>
            
            <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scroll-smooth">
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
        )}

        {/* Latest Section */}
        {latest && latest.mangas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                Update Terbaru ({sourceName})
              </h2>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {latest.mangas.slice(0, 6).map((manga) => (
                <MangaCard key={manga.id} manga={manga} sourceId={sourceId} />
              ))}
            </div>
            
            <div className="mt-8 flex justify-center pb-2">
              <Button 
                asChild
                variant="outline" 
                className="rounded-full px-6 py-5 font-bold text-sm border-border-strong hover:bg-surface-raised transition-all"
              >
                <Link href={`/sources/${sourceId}?sort=latest`}>
                  Eksplorasi {sourceName}
                </Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    );
  } catch (error) {
    console.error(`Failed to load feed for source ${sourceId}`, error);
    return (
      <div className="py-8 text-center text-text-muted border border-border-subtle rounded-xl bg-surface-raised/20">
        <p className="text-sm font-medium">Gagal memuat katalog dari {sourceName}</p>
      </div>
    );
  }
}
