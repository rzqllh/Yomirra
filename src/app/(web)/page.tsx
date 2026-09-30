import { Metadata } from "next";
import { HomeView } from "@/components/app/home-view";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { EmptyState } from "@/components/states/empty-state";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { UnifiedFeed } from "@/components/app/unified-feed";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";

export const metadata: Metadata = {
  title: "Yomirra - Reader Komik Multi-Sumber",
  description: "Baca Manga, Manhwa, dan Manhua dari berbagai sumber dalam satu antarmuka yang cepat dan terpadu.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const disabledSourcesCookie = cookieStore.get('yomirra-disabled-sources')?.value;
  let userDisabledSources: string[] = [];
  
  if (disabledSourcesCookie) {
    try {
      userDisabledSources = JSON.parse(decodeURIComponent(disabledSourcesCookie));
    } catch(e) {}
  }

  const allRuntimeSources = await getRuntimeSources();

  const activeSources = allRuntimeSources.filter(s => 
    s.isEnabled && 
    s.isInstalled && 
    s.status !== "unavailable" &&
    !userDisabledSources.includes(s.id)
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
            description="Pilih sumber yang mau tampil di Library dan Populer."
          />
        </div>
      )}
    </HomeView>
  );
}
