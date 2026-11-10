import { getMalPopular } from "@/server/lib/metadata/mal-popular";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { Fire } from "@phosphor-icons/react/dist/ssr";
import { getDiscoveryRuntimeSources } from "@/server/lib/sources/discovery-runtime-sources";
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
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { PageHeader } from "@/components/chrome/header";
import { PopularPageView } from "@/components/popular/popular-page-view";

export const metadata: Metadata = {
  title: "Populer di Yomirra — Yomirra",
  description: "Peringkat manga terpopuler dari sumber aktif dan referensi tren global.",
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
    await getDiscoveryRuntimeSources(),
    disabledSourceIds
  ).filter((source) => isSourceContentVisible(source, readOptions.hideNsfw !== false));

  const [feeds, mal] = await Promise.all([
    Promise.all(activeSources.map((source) => loadPopularFeed(source.id, source.name, readOptions))),
    getMalPopular(readOptions.hideNsfw !== false),
  ]);

  return (
    <Surface variant="base" className="w-full">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Populer di Yomirra"
          subtitle="Peringkat komik paling banyak dibaca dari sumber aktif pilihanmu."
          icon={<Fire size={24} weight="regular" />}
          hideDesktop={true}
        />
        <PopularPageView feeds={feeds} mal={mal} />
      </PageContainer>
    </Surface>
  );
}
