"use client";

import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { useLibraryStore } from "@/shared/store/library-store";
import { MangaCard } from "@/components/manga/manga-card";
import { BookBookmark, Compass } from "@phosphor-icons/react";
import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";

export default function ReadlistPage() {
  const isMounted = useMounted();
  const itemsMap = useLibraryStore((state) => state.items);
  const items = Object.values(itemsMap);
  
  // Sort by updatedAt descending
  const sortedItems = items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!isMounted) {
    return (
      <MobilePageShell title="Readlist">
        <div className="hidden md:block px-4 py-6">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Readlist</h1>
        </div>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title="Readlist">
      <div className="hidden md:block px-4 py-6">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Readlist</h1>
      </div>
      {sortedItems.length === 0 ? (
        <EmptyState
          icon={<BookBookmark size={48} className="text-text-muted" weight="duotone" />}
          title="Readlist masih kosong"
          description="Simpan judul dari halaman detail untuk menemukannya lagi di sini."
          action={
            <Button asChild variant="default" className="rounded-full">
              <Link href={getHomeHref()}>
                <Compass size={20} weight="bold" />
                Cari Manga
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-4">
          {sortedItems.map((item) => (
            <MangaCard
              key={`${item.sourceId}::${item.mangaId}`}
              manga={{
                id: item.mangaId,
                title: item.title,
                coverUrl: item.coverUrl || "",
                status: item.status,
              }}
              sourceId={item.sourceId}
            />
          ))}
        </div>
      )}
    </MobilePageShell>
  );
}
