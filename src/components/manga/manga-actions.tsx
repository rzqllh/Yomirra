"use client";

import { useLibraryStore } from "@/shared/store/library-store";
import { BookmarkSimple, Check } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface MangaActionsProps {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
  author?: string;
  status?: string;
}

export function MangaActions({
  sourceId,
  mangaId,
  title,
  coverUrl,
  author,
  status,
}: MangaActionsProps) {
  const isInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, mangaId));
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);

  const handleToggle = () => {
    toggleLibrary({
      sourceId,
      mangaId,
      title,
      coverUrl,
      author,
      status,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isInLibrary) {
      toast("Dihapus dari library");
    } else {
      toast.success("Ditambahkan ke library");
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant={isInLibrary ? "secondary" : "outline"}
      className="w-full rounded-full h-12 text-[15px] font-bold"
    >
      {isInLibrary ? (
        <>
          <Check size={18} weight="bold" className="text-success" />
          Tersimpan di library
        </>
      ) : (
        <>
          <BookmarkSimple size={18} weight="bold" />
          Masuk library
        </>
      )}
    </Button>
  );
}
