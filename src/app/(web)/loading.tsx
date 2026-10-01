import { HomeView } from "@/components/app/home-view";
import { SourceFeedSkeleton } from "@/components/app/source-feed-skeleton";

export default function Loading() {
  return (
    <HomeView>
      <SourceFeedSkeleton />
    </HomeView>
  );
}
