import { LibrarySkeleton } from "@/components/skeletons/library-skeleton";
import { YomirraSurface } from "@/components/ui/layout";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <YomirraSurface variant="base" className="flex-1 w-full max-w-9xl mx-auto md:pb-8">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 md:py-8">
          <LibrarySkeleton />
        </div>
      </YomirraSurface>
    </div>
  );
}
