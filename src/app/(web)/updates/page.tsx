import { Metadata } from "next";
import { DesktopPageTitle } from "@/components/app/header";
import { Lightning, PlugsConnected } from "@phosphor-icons/react/dist/ssr";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { Suspense } from "react";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { MangaCard } from "@/components/manga/manga-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Update Terbaru - Yomirra",
  description: "Manga, Manhwa, dan Manhua chapter terbaru.",
};

async function LatestFeed({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  let latest;
  try {
    const source = sourceManager.getSource(sourceId);
    latest = await withCache(`source:${sourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY);
  } catch (_error) {
    return null;
  }

  if (!latest?.mangas.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          {sourceName}
        </h2>
        <Link href={`/sources/${sourceId}?sort=latest`} className="text-sm font-bold text-accent hover:text-accent-hover transition-colors">
          Lihat Semua
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {latest.mangas.slice(0, 12).map((manga) => (
          <MangaCard key={manga.id} manga={manga} sourceId={sourceId} variant="history" />
        ))}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const activeSources = getAllSourceMetadata().filter(s => s.isEnabled && s.isInstalled);

  return (
    <main className="min-h-screen bg-surface-base">
      <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <DesktopPageTitle 
            title="Update Terbaru" 
            description="Manga, Manhwa, dan Manhua chapter terbaru."
            icon={<Lightning size={32} weight="duotone" />}
          />
        </div>
        
        {activeSources.map(source => (
          <Suspense key={source.id} fallback={<SourceFeedSkeleton />}>
            <LatestFeed sourceId={source.id} sourceName={source.name} />
          </Suspense>
        ))}
        
        {activeSources.length === 0 && (
          <div className="py-24">
            <EmptyState 
              icon={<PlugsConnected size={48} className="text-text-muted" weight="duotone" />} 
              title="Tidak ada sumber aktif" 
              description="Aktifkan atau install sumber manga di Pengaturan." 
            />
          </div>
        )}
      </div>
    </main>
  );
}
