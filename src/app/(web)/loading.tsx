import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <YomirraSurface variant="base" className="min-h-screen">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 pb-4 md:pb-8 max-w-9xl mx-auto flex flex-col gap-7">
          <PageHeader
            title="Beranda"
            description="Temukan dan baca komik favoritmu di satu tempat."
            icon={<Compass size={24} weight="duotone" />}
          />

          <SourceFeedSkeleton />
        </div>
      </YomirraSurface>
    </div>
  );
}
