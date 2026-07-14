import { Metadata } from "next";
import { DesktopPageTitle } from "@/components/app/header";
import { Lightning, PlugsConnected } from "@phosphor-icons/react/dist/ssr";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { Suspense } from "react";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { ShelfCard } from "@/components/manga/card";
import Link from "next/link";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Update Terbaru - Yomirra",
  description: "Manga, Manhwa, dan Manhua chapter terbaru.",
};

async function LatestFeed({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  let latest: any;
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 px-4 md:px-0">
        {latest.mangas.slice(0, 12).map((manga: any) => (
          <ShelfCard key={manga.id} manga={manga} sourceId={sourceId} />
        ))}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const activeBuiltin = getAllSourceMetadata().filter(s => s.isEnabled && s.isInstalled).map(s => ({ id: s.id, name: s.name }));

  const customSources: { id: string, name: string }[] = [];
  try {
    const cookieStore = await cookies();
    const urlsCookie = cookieStore.get("yomirra_dynamic_sources_urls")?.value;
    const sourcesCookie = cookieStore.get("yomirra_dynamic_sources")?.value;
    if (urlsCookie && sourcesCookie) {
      const parsedSources = JSON.parse(decodeURIComponent(sourcesCookie));
      for (const [id, manifest] of Object.entries(parsedSources)) {
        customSources.push({ id, name: (manifest as any).name || id });
      }
    }
  } catch(e) {}

  const activeSources = [...activeBuiltin, ...customSources];

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
