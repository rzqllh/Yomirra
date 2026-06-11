import { Metadata } from "next";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { swrCache, CACHE_TTL } from "@/server/lib/cache/strategies";
import { HomeView } from "@/components/app/home-view";
import { ErrorState } from "@/components/states/error-state";
import { TopBar } from "@/components/app/top-bar";

export const metadata: Metadata = {
  title: "Yomirra - Baca Komik Gratis",
  description: "Manga, Manhwa, dan Manhua reader cepat, ringan, tanpa iklan.",
};

export default async function HomePage() {
  const activeSourceId = "shinigami";

  let popular, latest;
  try {
    const source = sourceManager.getSource(activeSourceId);

    // Fetch on server in parallel
    [popular, latest] = await Promise.all([
      swrCache(`source:${activeSourceId}:popular:1`, () => source.getPopular(1), CACHE_TTL.DISCOVERY),
      swrCache(`source:${activeSourceId}:latest:1`, () => source.getLatest(1), CACHE_TTL.DISCOVERY),
    ]);

    // LOGGING TO INSPECT SHINIGAMI API DATA
    const rawPopular = await source.getPopular(1);
    console.log("SHINIGAMI_DEBUG:", JSON.stringify(rawPopular.mangas[0], null, 2));
  } catch (error) {
    console.error("Failed to load home page data", error);
    return (
      <main className="min-h-screen bg-surface-base pb-12">
        <div className="md:hidden">
          <TopBar title="Error" showBack={false} />
        </div>
        <div className="px-4 py-24 flex flex-col items-center justify-center">
          <ErrorState 
            title="Gagal memuat konten" 
            description="Terdapat masalah saat memuat data dari sumber." 
          />
        </div>
      </main>
    );
  }

  return (
    <HomeView 
      popular={popular}
      latest={latest}
      activeSourceId={activeSourceId}
    />
  );
}
