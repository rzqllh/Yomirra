"use client";

import * as React from "react";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useAuth } from "@/shared/hooks/use-auth";
import { GuestActionGateModal } from "@/components/auth/guest-action-gate-modal";
import { MangaKey } from "@/shared/types/collection";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/shared/hooks/use-mounted";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

interface MangaCollectionButtonProps {
  sourceId: string;
  mangaId: string;
  mangaDetail?: {
    title: string;
    coverUrl?: string;
    author?: string;
    status?: string;
  };
}

export function MangaCollectionButton({
  sourceId,
  mangaId,
  mangaDetail,
}: MangaCollectionButtonProps) {
  const { user } = useAuth();
  const mangaKey: MangaKey = `${sourceId}::${mangaId}`;
  const collections = useCollectionStore((state) => state.collections);
  const memberships = useCollectionStore(useShallow((state) => state.getMemberships(mangaKey))) || [];
  const addMangaToCollection = useCollectionStore((state) => state.addMangaToCollection);
  const removeMangaFromCollection = useCollectionStore((state) => state.removeMangaFromCollection);
  const createCollection = useCollectionStore((state) => state.createCollection);
  const mounted = useMounted();

  const [isOpen, setIsOpen] = React.useState(false);
  const [isGateOpen, setIsGateOpen] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");

  const handleOpenClick = () => {
    if (!user) {
      setIsGateOpen(true);
      return;
    }
    setIsOpen(true);
  };

  const ensureInLibrary = () => {
    if (!mangaDetail) return;
    const libraryStore = useLibraryStore.getState();
    if (!libraryStore.isInLibrary(sourceId, mangaId)) {
      libraryStore.addToLibrary({
        sourceId,
        mangaId,
        title: mangaDetail.title,
        coverUrl: mangaDetail.coverUrl,
        author: mangaDetail.author,
        status: mangaDetail.status,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Otomatis disimpan ke Rak Buku");
    }
  };

  const handleToggle = (collectionId: string, isMember: boolean) => {
    if (isMember) {
      removeMangaFromCollection(mangaKey, collectionId);
    } else {
      ensureInLibrary();
      addMangaToCollection(mangaKey, collectionId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createCollection(newCollectionName);
      toast.success("Koleksi berhasil dibuat");
      
      const state = useCollectionStore.getState();
      const newCol = state.collections.find(c => c.name.toLowerCase() === newCollectionName.trim().toLowerCase());
      if (newCol) {
        ensureInLibrary();
        addMangaToCollection(mangaKey, newCol.id);
      }
      
      setIsCreateMode(false);
      setNewCollectionName("");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat koleksi");
    }
  };

  const getLabel = () => {
    if (!mounted || memberships.length === 0) return "Kelola Koleksi";
    if (memberships.length === 1) {
      const col = collections.find(c => c.id === memberships[0]);
      return col ? col.name : "Kelola Koleksi";
    }
    return `${memberships.length} Koleksi`;
  };

  return (
    <>
      <button
        onClick={handleOpenClick}
        aria-label="Kelola koleksi"
        className={cn(
          "flex items-center justify-center gap-2 min-h-[44px] px-4 transition-all outline-none select-none rounded-[14px] border shadow-xs active:scale-95 bg-surface-raised",
          memberships.length > 0 && mounted
            ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20"
            : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <FolderPlus size={18} weight={memberships.length > 0 && mounted ? "fill" : "regular"} />
        <span className="text-[11px] font-bold tracking-tight">{getLabel()}</span>
      </button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setIsCreateMode(false);
      }}>
        <DialogContent className="max-w-sm sm:max-w-md">
          {!isCreateMode ? (
            <>
              <DialogHeader className="gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent text-accent shadow-xs shrink-0 select-none"
                  aria-hidden="true"
                >
                  <FolderPlus size={22} weight="duotone" />
                </div>
                <div>
                  <DialogTitle>Koleksi Komik</DialogTitle>
                  <DialogDescription className="mt-1.5">
                    Tambahkan komik ini ke folder koleksi.
                  </DialogDescription>
                </div>
              </DialogHeader>
              
              <div className="flex flex-col gap-2 mt-1 max-h-[300px] overflow-y-auto pr-1">
                {collections.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6 font-medium">Belum ada koleksi.</p>
                ) : (
                  collections.map((col) => {
                    const isMember = memberships.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => handleToggle(col.id, isMember)}
                        className={cn(
                          "flex items-center justify-between w-full p-3.5 rounded-xl transition-all border outline-none font-semibold text-sm select-none active:scale-[0.99]",
                          isMember
                            ? "bg-accent/15 border-accent/30 text-accent font-bold shadow-xs"
                            : "bg-surface-base border-border-default/60 text-text-primary hover:bg-surface-hover hover:border-border-strong"
                        )}
                      >
                        <span>{col.name}</span>
                        {isMember && <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-xs" />}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-2 pt-3 border-t border-border-default/40">
                <Button 
                  onClick={() => setIsCreateMode(true)} 
                  variant="outline" 
                  className="w-full h-11 rounded-full font-bold border-dashed border-border-default/80 hover:border-accent hover:text-accent"
                >
                  <FolderPlus size={18} className="mr-2" /> Buat Koleksi Baru
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <DialogHeader className="gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent text-accent shadow-xs shrink-0 select-none"
                  aria-hidden="true"
                >
                  <FolderPlus size={22} weight="duotone" />
                </div>
                <div>
                  <DialogTitle>Koleksi Baru</DialogTitle>
                  <DialogDescription className="mt-1.5">
                    Komik ini akan langsung ditambahkan ke koleksi baru.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div>
                <label htmlFor="new-collection-input" className="sr-only">
                  Nama Koleksi
                </label>
                <input
                  id="new-collection-input"
                  type="text"
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Nama Koleksi"
                  maxLength={40}
                  className="w-full bg-surface-base border border-border-default hover:border-border-strong rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-primary placeholder:text-text-muted transition-all font-medium text-sm"
                />
              </div>

              <DialogFooter className="flex-row gap-2.5 sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateMode(false)}
                  className="flex-1 sm:flex-none h-11 px-5 rounded-full font-bold border border-border-default/40 hover:bg-surface-hover"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={!newCollectionName.trim()}
                  className="flex-1 sm:flex-none h-11 px-5 rounded-full font-bold shadow-xs active:scale-95 transition-all"
                >
                  Buat & Tambahkan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <GuestActionGateModal
        isOpen={isGateOpen}
        onOpenChange={setIsGateOpen}
        actionType="collection"
        onProceedAsGuest={() => setIsOpen(true)}
        onLoginSuccess={() => setIsOpen(true)}
      />
    </>
  );
}
