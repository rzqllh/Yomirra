import { PageHeader } from "@/components/app/header";
import { MangaGridSkeleton } from "@/components/skeletons/manga-grid-skeleton";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col w-full relative pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-12 text-text-primary">
      <div className="w-full max-w-7xl mx-auto px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8">
        <PageHeader
          title="Pencarian"
          description="Cari judul komik, genre, atau filter dari berbagai sumber."
          icon={<MagnifyingGlass size={32} weight="duotone" />}
        />
        <div className="mt-8">
          <MangaGridSkeleton count={12} />
        </div>
      </div>
    </main>
  );
}
