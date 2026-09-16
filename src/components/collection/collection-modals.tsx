"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderPlus, PencilSimple } from "@phosphor-icons/react";

export interface CreateCollectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void | Promise<void>;
  submitLabel?: string;
  description?: string;
}

export function CreateCollectionModal({
  isOpen,
  onOpenChange,
  onSubmit,
  submitLabel = "Buat",
  description = "Masukkan nama untuk membuat folder koleksi baru.",
}: CreateCollectionModalProps) {
  const [name, setName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isLoading) return;

    try {
      setIsLoading(true);
      await onSubmit(trimmed);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader className="gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent text-accent shadow-xs shrink-0 select-none"
              aria-hidden="true"
            >
              <FolderPlus size={22} weight="duotone" />
            </div>
            <div>
              <DialogTitle>Koleksi Baru</DialogTitle>
              <DialogDescription className="mt-1.5">{description}</DialogDescription>
            </div>
          </DialogHeader>

          <div>
            <label htmlFor="create-collection-input" className="sr-only">
              Nama Koleksi
            </label>
            <input
              id="create-collection-input"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Koleksi"
              maxLength={40}
              className="w-full bg-surface-base border border-border-default hover:border-border-strong rounded-2xl px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-primary placeholder:text-text-muted transition-all font-medium text-sm"
            />
          </div>

          <DialogFooter className="flex-row gap-2.5 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold border border-border-default/40 hover:bg-surface-hover"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={!name.trim() || isLoading}
              className="flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold shadow-xs active:scale-95 transition-all"
            >
              {isLoading ? "Menyimpan..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface RenameCollectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onSubmit: (newName: string) => void | Promise<void>;
}

export function RenameCollectionModal({
  isOpen,
  onOpenChange,
  initialName,
  onSubmit,
}: RenameCollectionModalProps) {
  const [name, setName] = React.useState(initialName);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setIsLoading(false);
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isLoading) return;

    try {
      setIsLoading(true);
      await onSubmit(trimmed);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader className="gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent text-accent shadow-xs shrink-0 select-none"
              aria-hidden="true"
            >
              <PencilSimple size={22} weight="duotone" />
            </div>
            <div>
              <DialogTitle>Ubah Nama Koleksi</DialogTitle>
              <DialogDescription className="mt-1.5">
                Masukkan nama baru untuk folder koleksi ini.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div>
            <label htmlFor="rename-collection-input" className="sr-only">
              Nama Koleksi
            </label>
            <input
              id="rename-collection-input"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Koleksi"
              maxLength={40}
              className="w-full bg-surface-base border border-border-default hover:border-border-strong rounded-2xl px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-primary placeholder:text-text-muted transition-all font-medium text-sm"
            />
          </div>

          <DialogFooter className="flex-row gap-2.5 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold border border-border-default/40 hover:bg-surface-hover"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={!name.trim() || isLoading}
              className="flex-1 sm:flex-none h-11 px-5 rounded-2xl font-bold shadow-xs active:scale-95 transition-all"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
