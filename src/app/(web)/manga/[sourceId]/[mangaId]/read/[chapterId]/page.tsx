import { Metadata } from "next";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { ReaderView } from "@/components/reader/reader-view";
import { ReaderShell } from "@/components/reader/reader-shell";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }> 
}): Promise<Metadata> {
  const { sourceId, mangaId, chapterId } = await params;
  try {
    const source = sourceManager.getSource(sourceId);
    const [detail, chapters] = await Promise.all([
      swrCache(`source:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      swrCache(`source:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS)
    ]);
    const chapterTitle = chapters.find(c => c.id === chapterId)?.title || "Chapter";
    return {
      title: `${chapterTitle} - ${detail.title} - Yomirra`,
    };
  } catch (e) {
    return { title: "Membaca - Yomirra" };
  }
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }>;
}) {
  const { sourceId, mangaId, chapterId } = await params;

  let detail, chapters, pagesResult;
  try {
    const source = sourceManager.getSource(sourceId);
    
    // Fetch detail, chapters, and pages in parallel on the server
    [detail, chapters, pagesResult] = await Promise.all([
      swrCache(`source:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      swrCache(`source:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS),
      // Pages might fail, so we catch error and return null to let client retry or use offline cache
      swrCache(`source:${sourceId}:pages:${mangaId}:${chapterId}`, () => source.getPages(chapterId), CACHE_TTL.PAGES).catch(() => null),
    ]);
  } catch (error) {
    console.error("Failed to load reader data:", error);
    return (
      <ReaderShell chapterTitle="Error" currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen items-center justify-center text-text-muted">
          Gagal memuat chapter.
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
