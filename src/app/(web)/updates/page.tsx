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
  title: "Update Terbaru - Yomirra",
  description: "Manga, Manhwa, dan Manhua chapter terbaru.",
};

async function LatestFeed({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  let latest;
  try {
    const source = sourceManager.getSource(sourceId);
    latest = await swrCache(`source:${sourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY);
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
  const activeSources = sourceRegistry.filter(s => s.isEnabled && s.isInstalled);

  return (
    <main className="min-h-screen bg-surface-base">
      <YomirraPageHeader title="Update Terbaru" variant="auto" />
      
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary mb-8">Update Terbaru</h1>
        
        {activeSources.map(source => (
          <Suspense key={source.id} fallback={<SourceFeedSkeleton />}>
            <LatestFeed sourceId={source.id} sourceName={source.name} />
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
