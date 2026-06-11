"use client";

import * as React from "react";
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
  const [isMounted, setIsMounted] = React.useState(false);
  // eslint-disable-next-line
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, mangaId));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
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
      toast("Dihapus dari readlist");
    } else {
      toast.success("Ditambahkan ke readlist");
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
          Tersimpan di readlist
        </>
      ) : (
        <>
          <BookmarkSimple size={18} weight="bold" />
          Masuk readlist
        </>
      )}
    </Button>
  );
}
