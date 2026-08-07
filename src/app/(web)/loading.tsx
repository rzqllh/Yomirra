import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";
import { YomirraPageHeader } from "@/components/app/header";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <YomirraPageHeader title="Beranda" showBack={false} variant="auto" />
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-24 relative z-10 flex flex-col">
        <SourceFeedSkeleton />
      </div>
    </main>
  );
}
