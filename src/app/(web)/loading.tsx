import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { PageHeader } from "@/components/app/header";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title="Beranda" description="Baca komik terbaru dari berbagai sumber" />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-24 relative z-10 flex flex-col">
        <SourceFeedSkeleton />
      </div>
    </main>
  );
}
