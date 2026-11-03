import { SourceFeedSkeleton } from "@/components/home/source-feed-skeleton";

export default function Loading() {
  // Hidden container ensures seamless page transitions without jarring layout flashes
  // while preserving SourceFeedSkeleton geometry contract
  return (
    <div className="sr-only pointer-events-none" aria-hidden="true">
      <SourceFeedSkeleton />
    </div>
  );
}
