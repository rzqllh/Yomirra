"use client";

import * as React from "react";
import { useCollectionStore } from "@/shared/store/collection-store";
import { MangaKey } from "@/shared/types/collection";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/shared/hooks/use-mounted";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

interface MangaCollectionButtonProps {
  sourceId: string;
  mangaId: string;
}

export function MangaCollectionButton({ sourceId, mangaId }: MangaCollectionButtonProps) {
  const mangaKey: MangaKey = `${sourceId}::${mangaId}`;
  const collections = useCollectionStore((state) => state.collections);
  const memberships = useCollectionStore((state) => state.membershipsByManga[mangaKey]) || [];
  const addMangaToCollection = useCollectionStore((state) => state.addMangaToCollection);
  const removeMangaFromCollection = useCollectionStore((state) => state.removeMangaFromCollection);
  const createCollection = useCollectionStore((state) => state.createCollection);
  const mounted = useMounted();

  const [isOpen, setIsOpen] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");

  const handleToggle = (collectionId: string, isMember: boolean) => {
    if (isMember) {
      removeMangaFromCollection(mangaKey, collectionId);
    } else {
      addMangaToCollection(mangaKey, collectionId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createCollection(newCollectionName);
      toast.success("Koleksi berhasil dibuat");
      
      // Auto-add to the newly created collection
      // Since it's synchronous, we can just find it by name immediately or wait for re-render
      // But re-render might be tricky. Let's rely on the user to click it after creation or auto-add
      const state = useCollectionStore.getState();
      const newCol = state.collections.find(c => c.name.toLowerCase() === newCollectionName.trim().toLowerCase());
      if (newCol) {
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
      <Button
        variant="outline"
        className={cn(
          "w-full h-12 rounded-xl font-bold transition-all border-border-default",
          memberships.length > 0 && mounted ? "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20" : "bg-surface-raised text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        )}
        onClick={() => setIsOpen(true)}
      >
        <FolderPlus size={20} weight={memberships.length > 0 ? "fill" : "regular"} className="mr-2" />
        <span className="truncate max-w-[100px] sm:max-w-[140px]">{getLabel()}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setIsCreateMode(false);
      }}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          {!isCreateMode ? (
            <>
              <DialogHeader>
                <DialogTitle>Koleksi Manga</DialogTitle>
                <DialogDescription>
                  Tambahkan manga ini ke koleksi.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                {collections.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">Belum ada koleksi.</p>
                ) : (
                  collections.map((col) => {
                    const isMember = memberships.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => handleToggle(col.id, isMember)}
                        className={cn(
                          "flex items-center justify-between w-full p-3 rounded-xl transition-all border outline-none",
                          isMember
                            ? "bg-accent/10 border-accent/20 text-accent font-bold"
                            : "bg-surface-base border-border-strong text-text-primary hover:bg-surface-hover hover:border-border-default font-medium"
                        )}
                      >
                        {col.name}
                        {isMember && <span className="w-2 h-2 rounded-full bg-accent" />}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border-subtle/50">
                <Button 
                  onClick={() => setIsCreateMode(true)} 
                  variant="outline" 
                  className="w-full rounded-full font-bold border-dashed hover:border-accent hover:text-accent"
                >
                  <FolderPlus size={18} className="mr-2" /> Buat Koleksi Baru
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Koleksi Baru</DialogTitle>
                <DialogDescription>
                  Manga ini akan langsung ditambahkan ke koleksi baru.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4">
                <input
                  type="text"
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Nama Koleksi"
                  className="w-full bg-surface-base border border-border-strong rounded-xl px-4 py-2.5 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-text-primary placeholder:text-text-muted transition-colors"
                />
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-end mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreateMode(false)} className="rounded-full font-bold">
                  Batal
                </Button>
                <Button type="submit" variant="accent" disabled={!newCollectionName.trim()} className="rounded-full font-bold">
                  Buat & Tambahkan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
