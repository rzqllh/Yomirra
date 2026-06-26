import { Metadata } from "next";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { MangaDetailView } from "@/components/manga/manga-detail-view";
import { ErrorState } from "@/components/states/error-state";
import { YomirraPageHeader } from "@/components/app/header";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { cookies } from "next/headers";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sourceId: string; mangaId: string }> 
}): Promise<Metadata> {
  const { sourceId, mangaId } = await params;
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    const detail = await source.getDetail(mangaId);
    return {
      title: `${detail.title} - Yomirra`,
      description: detail.description?.slice(0, 150) + "...",
      openGraph: {
        images: detail.coverUrl ? [detail.coverUrl] : []
      }
    };
  } catch (e) {
    return { title: "Manga tidak ditemukan - Yomirra" };
  }
}

export const dynamic = "force-dynamic";

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string }>;
}) {
  const { sourceId, mangaId } = await params;

  let detail;
  let chapters;
  try {
    const cookieStore = await cookies();
    const disabledCookie = cookieStore.get("yomirra-disabled-sources");
    const disabledSources = disabledCookie ? JSON.parse(decodeURIComponent(disabledCookie.value)) : [];
    
    if (disabledSources.includes(sourceId)) {
      throw new Error("Source is disabled");
    }

    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    
    // Fetch data directly on the server with cache!
    [detail, chapters] = await Promise.all([
      withCache(`source:v2:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      withCache(`source:v2:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS),
    ]);
  } catch (error) {
    console.error("Failed to load manga details", error);
    return (
      <main className="min-h-screen flex flex-col w-full relative">
        <div className="md:hidden">
          <YomirraPageHeader title="Error" showBack variant="auto" />
        </div>
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-24 relative z-10 flex flex-col items-center justify-center">
          <ErrorState 
            title="Gagal memuat manga" 
            description="Manga ini tidak ditemukan atau sumber sedang bermasalah." 
          />
        </div>
      </main>
    );
  }

  return (
    <MangaDetailView 
      sourceId={sourceId}
      mangaId={mangaId}
      detail={detail}
      chapters={chapters}
    />
  );
}
