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
import { SearchInput } from "@/components/ui/search-input";
import { dynamicSourceRegistry, type MihonSourceManifest } from "@/shared/sources/dynamic-source-registry";
import { toast } from "sonner";
import { Spinner, Link, ShieldWarning, CheckCircle, XCircle, Globe, TerminalWindow } from "@phosphor-icons/react";

interface AddCustomSourceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddCustomSourceSheet({ open, onOpenChange, onSuccess }: AddCustomSourceSheetProps) {
  const [url, setUrl] = React.useState("");
  const [isChecking, setIsChecking] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [manifest, setManifest] = React.useState<MihonSourceManifest | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setUrl("");
        setManifest(null);
        setError(null);
        setIsChecking(false);
        setIsInstalling(false);
      }, 300);
    }
  }, [open]);

  const handleCheck = async () => {
    if (!url.trim()) return;
    
    setIsChecking(true);
    setError(null);
    setManifest(null);

    try {
      // Validate manifest without installing
      const parsedManifest = await dynamicSourceRegistry.validateManifest(url.trim());
      setManifest(parsedManifest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memvalidasi URL. Pastikan format JSON benar.";
      setError(msg);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!url || !manifest) return;
    
    setIsInstalling(true);
    try {
      await dynamicSourceRegistry.install(url.trim());
      toast.success(`Sumber ${manifest.name} berhasil diinstal!`);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menginstal sumber.";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md sm:mx-auto sm:border sm:rounded-b-none p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Tambah Sumber Kustom</SheetTitle>
          <SheetDescription>
            Masukkan URL manifest sumber (format JSON Yomirra).
          </SheetDescription>
        </SheetHeader>

        {!manifest ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">URL Manifest JSON</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link size={18} className="text-text-muted" weight="duotone" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-base border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCheck();
                    }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-semantic-error/10 border border-semantic-error/20 rounded-xl flex gap-3 items-start">
                <XCircle size={20} weight="fill" className="text-semantic-error shrink-0 mt-0.5" />
                <p className="text-xs text-semantic-error leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              onClick={handleCheck}
              disabled={!url.trim() || isChecking}
              className="w-full h-12 rounded-full font-bold mt-2"
              variant="accent"
            >
              {isChecking ? (
                <>
                  <Spinner size={20} className="mr-2 animate-spin" />
                  Memeriksa URL...
                </>
              ) : (
                "Validasi Sumber"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-surface-raised border border-border-default rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <TerminalWindow size={100} weight="duotone" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">{manifest.name}</h3>
                    <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                      <Globe size={14} /> {new URL(manifest.baseUrl).hostname}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-surface-hover rounded-md text-[10px] font-bold uppercase tracking-wider text-text-secondary border border-border-subtle">
                    v{manifest.version}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {manifest.lang.toUpperCase()}
                  </span>
                  {manifest.capabilities.map((cap) => (
                    <span key={cap} className="px-2 py-1 bg-surface-hover text-text-secondary rounded-md text-[10px] font-bold uppercase tracking-wider border border-border-subtle">
                      {cap}
                    </span>
                  ))}
                </div>

                {manifest.nsfw && (
                  <div className="flex items-center gap-2 mt-4 p-2 bg-semantic-warning/10 border border-semantic-warning/20 rounded-lg">
                    <ShieldWarning size={16} weight="duotone" className="text-semantic-warning" />
                    <span className="text-xs text-semantic-warning font-semibold">Sumber ini mengandung konten 18+ (NSFW)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-full font-bold border-border-default"
                onClick={() => setManifest(null)}
                disabled={isInstalling}
              >
                Batal
              </Button>
              <Button
                variant="accent"
                className="flex-[2] h-12 rounded-full font-bold"
                onClick={handleInstall}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <Spinner size={20} className="mr-2 animate-spin" />
                    Menginstal...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} className="mr-2" weight="bold" />
                    Instal Sumber
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
