"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import type { SourceMetadata } from "@/shared/sources/source-types";
import { toast } from "sonner";
import { Spinner, Link, TextT, ImageSquare, CheckCircle } from "@phosphor-icons/react";

interface EditCustomSourceSheetProps {
  source: SourceMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCustomSourceSheet({ source, open, onOpenChange, onSuccess }: EditCustomSourceSheetProps) {
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("");
  const [manifestUrl, setManifestUrl] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && source) {
      setName(source.name || "");
      setIcon(source.icon || "");
      setManifestUrl(source.manifestUrl || "");
    }
  }, [open, source]);

  const handleSave = async () => {
    if (!source) return;
    
    setIsSaving(true);
    try {
      await dynamicSourceRegistry.updateSource(source.id, {
        name: name.trim() || undefined,
        icon: icon.trim() || undefined,
        manifestUrl: manifestUrl.trim() || undefined
      });
      toast.success(`Sumber ${name || source.name} berhasil diperbarui`);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md sm:mx-auto sm:border sm:rounded-b-none p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Edit Sumber Kustom</SheetTitle>
          <SheetDescription>
            Ubah nama, ikon, atau URL manifest dari sumber ini.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary">Nama Sumber</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TextT size={18} className="text-text-muted" weight="duotone" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kosongkan untuk menggunakan nama asli"
                className="w-full pl-10 pr-4 py-3 bg-surface-base border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary">URL Ikon (Opsional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageSquare size={18} className="text-text-muted" weight="duotone" />
              </div>
              <input
                type="url"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-3 bg-surface-base border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary">URL Manifest JSON</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link size={18} className="text-text-muted" weight="duotone" />
              </div>
              <input
                type="url"
                value={manifestUrl}
                onChange={(e) => setManifestUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-3 bg-surface-base border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">Mengubah URL akan mengunduh ulang manifest.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full font-bold border-border-default"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              variant="accent"
              className="flex-[2] h-12 rounded-full font-bold"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner size={20} className="mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={20} className="mr-2" weight="bold" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
