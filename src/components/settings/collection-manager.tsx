"use client";

import * as React from "react";
import { useCollectionStore } from "@/shared/store/collection-store";
import { SettingsSection, SettingsItem, IconWrapper } from "@/app/(web)/settings/components/settings-ui";
import { Folder, Plus, Trash, PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMounted } from "@/shared/hooks/use-mounted";

export function CollectionManager() {
  const { collections, membershipsByManga, createCollection, renameCollection, deleteCollection } = useCollectionStore();
  const mounted = useMounted();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const [newName, setNewName] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createCollection(newName);
      toast.success("Koleksi berhasil dibuat");
      setIsCreateOpen(false);
      setNewName("");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat koleksi");
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      renameCollection(selectedId, newName);
      toast.success("Koleksi berhasil diubah");
      setIsRenameOpen(false);
      setNewName("");
      setSelectedId(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah koleksi");
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deleteCollection(selectedId);
    toast.success("Koleksi berhasil dihapus");
    setIsDeleteOpen(false);
    setSelectedId(null);
  };

  const openRename = (id: string, name: string) => {
    setSelectedId(id);
    setNewName(name);
    setIsRenameOpen(true);
  };

  const openDelete = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const getMangaCount = (collectionId: string) => {
    return Object.values(membershipsByManga).filter(ids => ids.includes(collectionId)).length;
  };

  if (!mounted) {
    return (
      <SettingsSection title="Koleksi Library">
        <div className="opacity-50 h-[80px] flex items-center justify-center">Memuat...</div>
      </SettingsSection>
    );
  }

  return (
    <>
      <SettingsSection title="Koleksi Library">
        <div className="px-4 py-3 flex justify-between items-center border-b border-border-subtle/50">
          <div>
            <h3 className="font-bold text-text-primary text-sm sm:text-base">Koleksi Tersimpan</h3>
            <p className="text-xs text-text-secondary mt-0.5">{collections.length} koleksi</p>
          </div>
          <Button 
            onClick={() => {
              setNewName("");
              setIsCreateOpen(true);
            }} 
            variant="accent" 
            size="sm" 
            className="rounded-full font-bold h-9"
          >
            <Plus size={16} weight="bold" className="mr-1.5" />
            Koleksi Baru
          </Button>
        </div>

        {collections.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">
            Belum ada koleksi yang dibuat.
          </div>
        ) : (
          <div className="flex flex-col">
            {collections.map((c, i) => (
              <div key={c.id}>
                <SettingsItem
                  icon={<IconWrapper variant="accent"><Folder size={20} weight="duotone" /></IconWrapper>}
                  title={c.name}
                  description={`${getMangaCount(c.id)} manga ditambahkan`}
                  right={
                    <div className="flex items-center gap-1">
                      <Button 
                        onClick={() => openRename(c.id, c.name)}
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary"
                        aria-label="Ubah nama"
                      >
                        <PencilSimple size={18} weight="duotone" />
                      </Button>
                      <Button 
                        onClick={() => openDelete(c.id)}
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 rounded-full text-semantic-error hover:text-white hover:bg-semantic-error transition-colors"
                        aria-label="Hapus"
                      >
                        <Trash size={18} weight="duotone" />
                      </Button>
                    </div>
                  }
                />
                {i < collections.length - 1 && (
                  <div className="mx-3 border-b border-border-subtle/50" />
                )}
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Koleksi Baru</DialogTitle>
              <DialogDescription>
                Masukkan nama untuk koleksi baru.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Koleksi"
                className="w-full bg-surface-base border border-border-strong rounded-xl px-4 py-2.5 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-text-primary placeholder:text-text-muted transition-colors"
              />
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-full font-bold">
                Batal
              </Button>
              <Button type="submit" variant="accent" disabled={!newName.trim()} className="rounded-full font-bold">
                Buat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Ubah Nama Koleksi</DialogTitle>
              <DialogDescription>
                Masukkan nama baru untuk koleksi ini.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Koleksi"
                className="w-full bg-surface-base border border-border-strong rounded-xl px-4 py-2.5 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-text-primary placeholder:text-text-muted transition-colors"
              />
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsRenameOpen(false)} className="rounded-full font-bold">
                Batal
              </Button>
              <Button type="submit" variant="accent" disabled={!newName.trim()} className="rounded-full font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          <DialogHeader>
            <DialogTitle>Hapus Koleksi?</DialogTitle>
            <DialogDescription>
              Koleksi ini akan dihapus. Manga di dalam koleksi tidak akan dihapus dari Library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="rounded-full font-bold flex-1 sm:flex-none">
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-full font-bold flex-1 sm:flex-none">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
