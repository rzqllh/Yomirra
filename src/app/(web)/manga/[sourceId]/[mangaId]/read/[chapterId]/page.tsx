import { Metadata, Viewport } from "next";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { ReaderView } from "@/components/reader/reader-view";
import { ReaderShell } from "@/components/reader/reader-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }> 
}): Promise<Metadata> {
  const { sourceId, mangaId, chapterId } = await params;
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    const [detail, chapters] = await Promise.all([
      withCache(`source:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      withCache(`source:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS)
    ]);
    const chapterTitle = chapters.find((c: any) => c.id === chapterId)?.title || "Chapter";
    return {
      title: `${chapterTitle} - ${detail.title} - Yomirra`,
    };
  } catch (e) {
    return { title: "Membaca - Yomirra" };
  }
}

export const revalidate = 1800;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }>;
}) {
  const { sourceId, mangaId, chapterId } = await params;

  let detail: any, chapters: any, pagesResult: any;
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    
    // Fetch detail, chapters, and pages in parallel on the server
    [detail, chapters, pagesResult] = await Promise.all([
      withCache(`source:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      withCache(`source:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS),
      // Pages might fail, so we catch error and return null to let client retry or use offline cache
      withCache(`source:${sourceId}:pages:${mangaId}:${chapterId}`, () => source.getPages(chapterId), CACHE_TTL.PAGES).catch(() => null),
    ]);
  } catch (error) {
    console.error("Failed to load reader data:", error);
    return (
      <ReaderShell chapterTitle="Error" currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen items-center justify-center pt-16">
          <EmptyState
            icon={<WarningCircle size={48} weight="duotone" className="text-text-muted" />}
            title="Gagal Memuat Chapter"
            description="Terjadi kesalahan saat mengambil data chapter dari server."
            action={
              <Button asChild variant="outline" className="rounded-full shadow-sm mt-2 font-bold">
                <Link href={getMangaDetailHref(sourceId, mangaId)}>
                  Kembali ke Detail
                </Link>
              </Button>
            }
          />
        </div>
      </ReaderShell>
    );
  }

  return (
    <ReaderView 
      sourceId={sourceId}
      mangaId={mangaId}
      chapterId={chapterId}
      initialDetail={detail}
      initialChapters={chapters}
      initialPages={pagesResult?.pages || null}
    />
  );
}
