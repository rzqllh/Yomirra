import { Metadata, Viewport } from "next";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { ReaderView } from "@/components/reader/reader-view";
import { ReaderShell } from "@/components/reader/reader-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { getMangaDetailHref, getSafeMangaDetailBackHref } from "@/shared/lib/routes";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import { SourceError } from "@/server/lib/sources/error";
import { DeadSourceRecovery } from "@/components/manga/dead-source-recovery";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }> 
}): Promise<Metadata> {
  const rawParams = await params;
  const sourceId = decodeURIComponent(rawParams.sourceId);
  const mangaId = decodeURIComponent(rawParams.mangaId);
  const chapterId = decodeURIComponent(rawParams.chapterId);
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const rawParams = await params;
  const rawSearchParams = await searchParams;
  const sourceId = decodeURIComponent(rawParams.sourceId);
  const mangaId = decodeURIComponent(rawParams.mangaId);
  const chapterId = decodeURIComponent(rawParams.chapterId);
  const rawReturnTo = Array.isArray(rawSearchParams.returnTo)
    ? rawSearchParams.returnTo[0]
    : rawSearchParams.returnTo;
  const returnTo = getSafeMangaDetailBackHref(rawReturnTo ?? null);
  const detailHref = getMangaDetailHref(sourceId, mangaId, returnTo);

  let detail: any, chapters: any, pagesResult: any;
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    
    // Fetch detail, chapters, and fast-race pages cache to prevent blocking RSC commit on slow scrapers
    const fastPagesPromise = Promise.race([
      withCache(`source:${sourceId}:pages:${mangaId}:${chapterId}`, () => source.getPages(chapterId), CACHE_TTL.PAGES).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 250)),
    ]);

    [detail, chapters, pagesResult] = await Promise.all([
      withCache(`source:${sourceId}:manga:${mangaId}`, () => source.getDetail(mangaId), CACHE_TTL.DETAIL),
      withCache(`source:${sourceId}:chapters:${mangaId}`, () => source.getChapters(mangaId), CACHE_TTL.CHAPTERS),
      fastPagesPromise,
    ]);

    if (pagesResult?.pages) {
      const { signImageUrl } = await import("@/server/lib/sign-proxy-url");
      pagesResult.pages = pagesResult.pages.map((p: any) => ({
        ...p,
        url: signImageUrl(p.url, p.referer || source.baseUrl)
      }));
    }
  } catch (error) {
    console.error("Failed to load reader data:", error);
    const errorText = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isNotFound =
      errorText.includes("404") ||
      errorText.includes("not found") ||
      errorText.includes("tidak ditemukan");

    if (!isNotFound) {
      const classified = SourceError.classify(error, sourceId, "chapters");
      const recoveryStatus =
        classified.code === "RATE_LIMITED"
          ? "RATE_LIMITED"
          : classified.code === "UPSTREAM_TIMEOUT" || classified.code === "UPSTREAM_BLOCKED"
            ? "DEGRADED"
            : ["SOURCE_DOWN", "DOMAIN_CHANGED", "ROUTE_CHANGED", "PARSER_BROKEN", "SCHEMA_CHANGED", "DECRYPT_FAILURE"].includes(classified.code)
              ? "BROKEN"
              : null;

      if (recoveryStatus) {
        return (
          <DeadSourceRecovery
            sourceId={sourceId}
            mangaId={mangaId}
            health={{ status: recoveryStatus, errorCode: classified.code, message: classified.message }}
          />
        );
      }
    }

    return (
      <ReaderShell mangaTitle={detail?.title} chapterTitle="Tidak tersedia" currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen items-center justify-center pt-16">
          <EmptyState
            icon={<WarningCircle size={48} weight="duotone" className="text-text-muted" />}
            title="Chapter belum bisa dimuat"
            description="Chapter belum bisa dimuat dari sumber ini."
            action={
              <Button asChild variant="outline" className="rounded-xl shadow-sm mt-2 font-bold">
                <Link href={detailHref} replace>
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
      returnTo={returnTo}
    />
  );
}
