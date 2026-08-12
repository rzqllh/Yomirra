import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/app/header";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";

export default function BookmarkLoading() {
  return (
    <div className="flex flex-col min-h-screen pb-[var(--page-bottom-safe)]">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8">
        <PageHeader
          title="Rak Buku"
          description="Daftar komik yang kamu tandai dan simpan."
          icon={<BookmarkSimple size={32} weight="duotone" />}
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MangaCardSkeleton key={i} variant="history" />
          ))}
        </div>
      </div>
    </div>
  );
}
