"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CollectionSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onCancelSelection: () => void;
  isDeleteDialogOpen: boolean;
  onOpenDeleteDialogChange: (open: boolean) => void;
  onConfirmBulkDelete: () => void;
}

export function CollectionSelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onCancelSelection,
  isDeleteDialogOpen,
  onOpenDeleteDialogChange,
  onConfirmBulkDelete,
}: CollectionSelectionToolbarProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-3 bg-surface-raised border border-border-subtle rounded-2xl mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="rounded-full text-xs font-bold"
          >
            {isAllSelected ? "Batal Semua" : "Pilih Semua"}
          </Button>
          <span className="text-xs font-bold text-text-muted">
            {selectedCount} terpilih
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelSelection}
            className="rounded-full text-xs font-bold"
          >
            Selesai
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => onOpenDeleteDialogChange(true)}
              className="rounded-full text-xs font-bold bg-semantic-error hover:bg-semantic-error/90 text-white gap-1"
            >
              <Trash size={14} weight="bold" />
              Hapus ({selectedCount})
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={onOpenDeleteDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Bookmark</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus {selectedCount} manga dari bookmark?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenDeleteDialogChange(false)}>
              Batal
            </Button>
            <Button
              variant="accent"
              onClick={onConfirmBulkDelete}
              className="bg-semantic-error hover:bg-semantic-error/90 text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
