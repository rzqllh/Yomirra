import { Metadata } from "next";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { MangaDetailView } from "@/components/manga/manga-detail-view";
import { ErrorState } from "@/components/states/error-state";
import { TopBar } from "@/components/app/top-bar";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sourceId: string; mangaId: string }> 
}): Promise<Metadata> {
  const { sourceId, mangaId } = await params;
  try {
    const source = sourceManager.getSource(sourceId);
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

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string }>;
}) {
  const { sourceId, mangaId } = await params;

  try {
    const source = sourceManager.getSource(sourceId);
    
    // Fetch data directly on the server with cache!
    const [detail, chapters] = await Promise.all([
      swrCache(`source:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      swrCache(`source:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS),
    ]);

    return (
      <MangaDetailView 
        sourceId={sourceId}
        mangaId={mangaId}
        detail={detail}
        chapters={chapters}
      />
    );
  } catch (error) {
    console.error("Failed to load manga details", error);
    return (
      <main className="min-h-screen flex flex-col w-full relative">
        <div className="md:hidden">
          <TopBar title="Error" showBack />
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
}
