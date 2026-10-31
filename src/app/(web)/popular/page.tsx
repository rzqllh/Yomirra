import { Metadata } from "next";
import { cookies } from "next/headers";
import { Fire } from "@phosphor-icons/react/dist/ssr";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { getServerReadOptions, loadSourceCatalog } from "@/server/lib/sources/content-access";
import { isSourceContentVisible } from "@/shared/sources/content-policy";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";
import {
  parseDisabledSourceIdsCookie,
  selectDiscoverySources,
} from "@/shared/sources/discovery-source-policy";
import type { SourceReadOptions, MangaItem } from "@/shared/sources/source-types";
import type { PopularSourceFeed } from "@/shared/lib/popular-ranking";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { PageHeader } from "@/components/chrome/header";
import { PopularPageView } from "@/components/popular/popular-page-view";

export const metadata: Metadata = {
  title: "Komik Populer — Yomirra",
  description: "Peringkat populer gabungan dari sumber aktif.",
};

export const dynamic = "force-dynamic";

async function loadPopularFeed(
  sourceId: string,
  sourceName: string,
  readOptions: SourceReadOptions
): Promise<PopularSourceFeed> {
  try {
    const manifestUrl = await getManifestUrlFromCookie(sourceId);
    const source = await sourceManager.getSource(sourceId, manifestUrl);
    const result = await loadSourceCatalog(source, "popular", 1, readOptions);

    return {
      sourceId,
      sourceName,
      mangas: (result?.mangas || []) as MangaItem[],
      loadFailed: false,
    };
  } catch {
    return {
      sourceId,
      sourceName,
      mangas: [],
      loadFailed: true,
    };
  }
}

export default async function PopularPage() {
  const cookieStore = await cookies();
  const readOptions = await getServerReadOptions();
  const disabledSourceIds = parseDisabledSourceIdsCookie(
    cookieStore.get("yomirra-disabled-sources")?.value
  );
  const activeSources = selectDiscoverySources(
    await getRuntimeSources(),
    disabledSourceIds
  ).filter((source) => isSourceContentVisible(source, readOptions.hideNsfw !== false));

  const feeds = await Promise.all(
    activeSources.map((source) => loadPopularFeed(source.id, source.name, readOptions))
  );

  return (
    <YomirraSurface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Populer"
          subtitle="Peringkat dari sumber yang kamu aktifkan."
          icon={<Fire size={24} weight="duotone" />}
        />
        <PopularPageView feeds={feeds} />
      </PageContainer>
    </YomirraSurface>
  );
}
