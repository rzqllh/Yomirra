import { Metadata } from "next";
import { HomeView } from "@/components/app/home-view";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { EmptyState } from "@/components/states/empty-state";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { UnifiedFeed } from "@/components/app/unified-feed";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";

export const metadata: Metadata = {
  title: "Yomirra - Baca Komik Gratis",
  description: "Manga, Manhwa, dan Manhua reader cepat, ringan, tanpa iklan.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const disabledSourcesCookie = cookieStore.get('yomirra-disabled-sources')?.value;
  let disabledSources: string[] = [];
  
  if (disabledSourcesCookie) {
    try {
      disabledSources = JSON.parse(decodeURIComponent(disabledSourcesCookie));
    } catch(e) {}
  }

  const activeSources = sourceRegistry.filter(s => 
    s.isEnabled && 
    s.isInstalled && 
    s.status !== "unavailable" &&
    !disabledSources.includes(s.id)
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
            title="Tidak ada sumber komik yang aktif."
            description="Periksa halaman sumber untuk mengaktifkan sumber komik."
          />
        </div>
      )}
    </HomeView>
  );
}
