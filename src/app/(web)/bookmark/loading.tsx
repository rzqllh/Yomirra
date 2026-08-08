import { BookBookmark } from "@phosphor-icons/react/dist/ssr";
import { YomirraPageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";

export default function BookmarkLoading() {
  return (
    <div className="flex flex-col min-h-screen pb-[var(--page-bottom-safe)]">
      <h1 className="sr-only">Rak Buku Yomirra</h1>
      <YomirraPageHeader
        title="Rak Buku"
        variant="transparent"
        icon={<BookBookmark size={24} weight="duotone" />}
      />
      <div className="flex-1 w-full max-w-7xl mx-auto">
        {/* Desktop title skeleton */}
        <div className="hidden md:block px-4 py-8">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Rak Buku
          </h1>
        </div>
        {/* Tab skeleton */}
        <div className="px-4 pt-2 pb-3">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        {/* Card skeletons */}
        <div className="px-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MangaCardSkeleton key={i} variant="history" />
          ))}
        </div>
      </div>
    </div>
  );
}
