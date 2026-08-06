"use client";

import * as React from "react";
import { DownloadSimple, UploadSimple, ShieldWarning, CheckCircle, Warning, FileText } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { performDryRun, executeCoordinatedRestore, triggerBackupDownload } from "@/shared/lib/backup-engine";
import type { DryRunPreview, ImportMode } from "@/shared/lib/backup-schema";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";

interface BackupRestoreModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupRestoreModal({ isOpen, onOpenChange }: BackupRestoreModalProps) {
  const { theme, setTheme } = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const [dryRun, setDryRun] = React.useState<DryRunPreview | null>(null);
  const [importMode, setImportMode] = React.useState<ImportMode>("merge");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleExport = () => {
    try {
      const activeTheme = (theme as "light" | "dark" | "system") || "system";
      triggerBackupDownload(activeTheme);
      toast.success("File backup JSON berhasil didownload");
    } catch {
      toast.error("Gagal mendownload file backup");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const preview = performDryRun(content);
        setDryRun(preview);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file JSON");
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!dryRun?.backupPayload) {
      toast.error("Tidak ada data backup valid untuk dipulihkan");
      return;
    }

    try {
      setIsProcessing(true);
      const res = executeCoordinatedRestore(
        dryRun.backupPayload,
        importMode,
        (newTheme) => setTheme(newTheme)
      );

      if (res.success) {
        toast.success(`Restorasi data lokal berhasil (${res.restoredCount} item dipulihkan)`, {
          description: importMode === "merge" ? "Data digabungkan dengan rekonsiliasi timestamp." : "Data lokal diganti total dari backup.",
        });
        onOpenChange(false);
        resetState();
      }
    } catch (err: any) {
      toast.error("Gagal melakukan restorasi data lokal", {
        description: err.message || "Terjadi kesalahan. Snapshot awal telah dipulihkan.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setSelectedFileName(null);
    setDryRun(null);
    setImportMode("merge");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetState(); }}>
      <DialogContent className="max-w-md w-full rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl border border-border-glass shadow-glass">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FileText size={24} weight="duotone" className="text-accent" />
            Backup & Restore Data
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Export koleksi lokal ke JSON atau pulihkan data dari file backup resmi Yomirra (v1).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Action Choice: Export vs File Input */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              className="h-20 flex-col gap-1 rounded-2xl border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all text-left"
            >
              <DownloadSimple size={22} weight="duotone" className="text-accent" />
              <span className="text-xs font-bold text-text-primary">Export JSON</span>
              <span className="text-[10px] text-text-muted">Simpan data lokal</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 flex-col gap-1 rounded-2xl border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all text-left"
            >
              <UploadSimple size={22} weight="duotone" className="text-accent" />
              <span className="text-xs font-bold text-text-primary">Pilih File JSON</span>
              <span className="text-[10px] text-text-muted truncate max-w-[110px]">
                {selectedFileName || "Upload file backup"}
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Dry Run Preview Report */}
          {dryRun && (
            <div className="space-y-4 rounded-2xl bg-surface-raised p-4 border border-border-subtle text-xs">
              <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  {dryRun.errors.length === 0 ? (
                    <CheckCircle size={18} weight="fill" className="text-semantic-success" />
                  ) : (
                    <Warning size={18} weight="fill" className="text-semantic-error" />
                  )}
                  Hasil Dry-Run Preview
                </span>
                <span className="text-[11px] font-semibold text-text-muted">
                  Schema v{dryRun.backupPayload?.schemaVersion || "?"}
                </span>
              </div>

              {/* Error messages */}
              {dryRun.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-semantic-error/10 border border-semantic-error/20 text-semantic-error space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldWarning size={16} /> Error Validasi ({dryRun.errors.length}):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {dryRun.errors.slice(0, 4).map((err, idx) => (
                      <li key={idx} className="truncate">
                        <span className="font-mono">{err.path}</span>: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success metrics */}
              {dryRun.errors.length === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-2 text-text-secondary">
                    <div className="p-2 rounded-xl bg-surface-base border border-border-subtle/40">
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Library Valid</span>
                      <span className="text-sm font-extrabold text-text-primary">{dryRun.validLibraryCount} item</span>
                    </div>
                    <div className="p-2 rounded-xl bg-surface-base border border-border-subtle/40">
                      <span className="text-[10px] uppercase font-bold text-text-muted block">History Valid</span>
                      <span className="text-sm font-extrabold text-text-primary">{dryRun.validHistoryCount} item</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-text-secondary">
                    <div className="flex justify-between">
                      <span>Duplikat di file:</span>
                      <span className="font-bold text-text-primary">{dryRun.duplicateInPayloadCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Konflik data lokal:</span>
                      <span className="font-bold text-text-primary">{dryRun.existingConflictCount}</span>
                    </div>
                    <div className="flex justify-between text-semantic-success">
                      <span>Item baru akan ditambah:</span>
                      <span className="font-bold">+{dryRun.addedCount}</span>
                    </div>
                    <div className="flex justify-between text-accent">
                      <span>Item akan diperbarui:</span>
                      <span className="font-bold">{dryRun.replacedCount}</span>
                    </div>
                    {dryRun.excludedNsfwCount > 0 && (
                      <div className="flex justify-between text-semantic-warning">
                        <span>NSFW dikecualikan:</span>
                        <span className="font-bold">{dryRun.excludedNsfwCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-border-subtle/50 space-y-2">
                    <span className="font-bold text-text-primary block">Pilih Mode Import:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode("merge")}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all",
                          importMode === "merge"
                            ? "border-accent bg-accent/10 text-accent font-bold"
                            : "border-border-subtle text-text-secondary hover:bg-surface-hover"
                        )}
                      >
                        <span className="block text-xs">Gabung (Merge)</span>
                        <span className="block text-[10px] text-text-muted font-normal mt-0.5">
                          Perbarui jika timestamp lebih baru
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode("replace")}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all",
                          importMode === "replace"
                            ? "border-semantic-error bg-semantic-error/10 text-semantic-error font-bold"
                            : "border-border-subtle text-text-secondary hover:bg-surface-hover"
                        )}
                      >
                        <span className="block text-xs">Ganti Total</span>
                        <span className="block text-[10px] text-text-muted font-normal mt-0.5">
                          Timpa data lokal dengan backup
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-end mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full font-bold h-11"
          >
            Tutup
          </Button>
          {dryRun && dryRun.errors.length === 0 && (
            <Button
              type="button"
              variant={importMode === "replace" ? "destructive" : "accent"}
              onClick={handleExecuteRestore}
              disabled={isProcessing}
              className="flex-1 rounded-full font-bold h-11"
            >
              Pulihkan Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
