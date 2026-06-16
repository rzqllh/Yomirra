import * as React from "react"
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { YomirraSection } from "@/components/ui/yomirra-layout";
import { ErrorState } from "@/components/states/error-state";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";
import { PopularCarousel } from "@/components/ui/popular-carousel";
import { MagazineHero } from "@/components/app/magazine-hero";

interface SourceFeedProps {
  sourceId: string;
  sourceName: string;
  variant?: string;
}

export async function SourceFeed({ sourceId, sourceName, variant }: SourceFeedProps) {
  let popular = null;
  let latest = null;

  try {
    const source = sourceManager.getSource(sourceId);

    // Fetch on server in parallel
    const [popularData, latestData] = await Promise.all([
      swrCache(`source:${sourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY),
      swrCache(`source:${sourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY),
    ]);
    popular = popularData;
    latest = latestData;
  } catch (error) {
    console.error(`Failed to load feed for source ${sourceId}`, error);
    return (
      <div className="py-12 border border-border-subtle rounded-2xl bg-surface-raised/20 mb-12">
        <ErrorState 
          title="Gagal memuat katalog"
          description={`Gagal mengambil katalog manga dari ${sourceName}. Sumber mungkin sedang tidak tersedia.`}
        />
      </div>
    );
  }

  if (!popular?.mangas.length && !latest?.mangas.length) {
    return null;
  }

  const heroMangas = latest?.mangas.slice(0, 3) || [];
  const sideMangas = popular?.mangas.slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row gap-6 bg-surface-base p-2 md:p-4 rounded-[36px] border border-border-subtle/50">
        <MagazineHero sourceId={sourceId} mangas={heroMangas} />
        
        <div className="w-full md:w-1/3 flex flex-col pt-2 md:pt-4 px-2 md:px-0">
          <div className="flex justify-between items-end mb-5">
            <h3 className="text-xl font-bold tracking-tight">Sedang Tren</h3>
            <Link href={`/sources/${sourceId}?sort=popular`} className="text-xs font-bold text-accent hover:underline">
              Lihat Semua
            </Link>
          </div>
          
          <div className="flex flex-col gap-4 flex-1">
            {sideMangas?.map((manga, idx) => (
              <Link 
                key={manga.id} 
                href={`/sources/${sourceId}/manga/${manga.id}`}
                className="flex gap-4 items-center group bg-surface-raised hover:bg-surface-overlay p-2.5 rounded-2xl transition-colors border border-white/5"
              >
                <div className="w-8 flex justify-center">
                  <span className={cn(
                    "text-xl font-black italic",
                    idx === 0 ? "text-amber-500" : 
                    idx === 1 ? "text-slate-400" : 
                    idx === 2 ? "text-amber-700" : "text-white/20"
                  )}>
                    {idx + 1}
                  </span>
                </div>
                <div className="w-[52px] h-[72px] rounded-lg overflow-hidden shrink-0 shadow-md">
                  <img src={manga.coverUrl || ""} alt={manga.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-sm text-text-primary line-clamp-2 group-hover:text-accent transition-colors">{manga.title}</h4>
                  <p className="text-xs text-text-muted mt-1 truncate">Manga</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
