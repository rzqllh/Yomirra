import { sourceManager } from "@/server/lib/sources/source-manager";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";
import { MangaDetailDemoClient } from "./client";
import type { MangaDetail, Chapter } from "@/shared/types/source";

// Stable Shinigami manga — "Solo Leveling" (widely available, rich data)
const DEMO_SOURCE_ID = "shinigami";
const DEMO_MANGA_ID = "solo-leveling";

export const dynamic = "force-dynamic";

export default async function MangaDetailDemoPage() {
  let detail: MangaDetail | null = null;
  let chapters: Chapter[] = [];
  let error: string | null = null;

  try {
    const source = await sourceManager.getSource(DEMO_SOURCE_ID);
    [detail, chapters] = await Promise.all([
      withCache(
        `demo:${DEMO_SOURCE_ID}:detail:${DEMO_MANGA_ID}`,
        () => source.getDetail(DEMO_MANGA_ID),
        CACHE_TTL.DETAIL
      ) as Promise<MangaDetail>,
      withCache(
        `demo:${DEMO_SOURCE_ID}:chapters:${DEMO_MANGA_ID}`,
        () => source.getChapters(DEMO_MANGA_ID),
        CACHE_TTL.CHAPTERS
      ) as Promise<Chapter[]>,
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Gagal fetch data";
  }

  return (
    <MangaDetailDemoClient
      detail={detail}
      chapters={chapters}
      sourceId={DEMO_SOURCE_ID}
      mangaId={DEMO_MANGA_ID}
      fetchError={error}
    />
  );
}
