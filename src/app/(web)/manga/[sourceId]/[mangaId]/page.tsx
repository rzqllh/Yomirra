import { Metadata } from "next";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { MangaDetailView } from "@/components/manga/manga-detail-view";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/app/header";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { cookies } from "next/headers";

import { DeadSourceRecovery } from "@/components/manga/dead-source-recovery";

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
    return <DeadSourceRecovery sourceId={sourceId} mangaId={mangaId} />;
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
