import { SourceFeedSkeleton } from "@/components/home/source-feed-skeleton";

export default function Loading() {
  return (
    <div className="w-full" aria-label="Memuat beranda...">
      <SourceFeedSkeleton />
    </div>
  );
}

