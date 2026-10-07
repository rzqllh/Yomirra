import { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { EmptyState } from "@/components/states/empty-state";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { UnifiedFeed } from "@/components/home/unified-feed";
import { SourceFeedSkeleton } from "@/components/home/source-feed-skeleton";
import { parseDisabledSourceIdsCookie, selectDiscoverySources } from "@/shared/sources/discovery-source-policy";

export const metadata: Metadata = {
  title: "Yomirra - Reader Komik Multi-Sumber",
  description: "Baca Manga, Manhwa, dan Manhua dari berbagai sumber dalam satu antarmuka yang cepat dan terpadu.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const userDisabledSources = parseDisabledSourceIdsCookie(
    cookieStore.get("yomirra-disabled-sources")?.value
  );

  const allRuntimeSources = await getRuntimeSources();
  const activeSources = selectDiscoverySources(
    allRuntimeSources,
    userDisabledSources
  );

  return (
    <HomeView>
      <Suspense fallback={<SourceFeedSkeleton />}>
        <UnifiedFeed activeSources={activeSources} />
      </Suspense>

      {activeSources.length === 0 && (
        <div className="py-10">
          <EmptyState
            icon={<WarningCircle size={40} className="text-accent" weight="duotone" />}
            title="Tidak ada sumber yang aktif."
            description="Pilih sumber yang mau tampil di Beranda, Library, dan Populer."
          />
        </div>
      )}
    </HomeView>
  );
}
