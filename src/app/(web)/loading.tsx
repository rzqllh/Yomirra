import { HomeView } from "@/components/home/home-view";
import { SourceFeedSkeleton } from "@/components/home/source-feed-skeleton";

export default function Loading() {
  return (
    <HomeView>
      <SourceFeedSkeleton />
    </HomeView>
  );
}
