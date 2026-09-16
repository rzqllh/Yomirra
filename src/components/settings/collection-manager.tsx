"use client";

import * as React from "react";
import { useCollectionStore } from "@/shared/store/collection-store";
import { SettingsSection, SettingsItem, IconWrapper } from "@/app/(web)/settings/components/settings-ui";
import { Folder, Plus, Trash, PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { CreateCollectionModal, RenameCollectionModal } from "@/components/collection/collection-modals";
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

  const handleCreate = (name: string) => {
    try {
      createCollection(name);
      toast.success("Koleksi berhasil dibuat");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat koleksi");
    }
  };

  const handleRename = (name: string) => {
    if (!selectedId) return;
    try {
      renameCollection(selectedId, name);
      toast.success("Koleksi berhasil diubah");
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

      {/* Create Modal */}
      <CreateCollectionModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Rename Modal */}
      <RenameCollectionModal
        isOpen={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        initialName={newName}
        onSubmit={handleRename}
      />

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Koleksi?"
        description="Folder koleksi ini akan dihapus. Komik di dalamnya tidak akan terhapus dari Rak Buku."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}
