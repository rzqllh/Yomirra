"use client";

import * as React from "react";
import { DownloadSimple, UploadSimple, ShieldWarning, CheckCircle, Warning, FileText } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { performDryRun, executeCoordinatedRestore, triggerBackupDownload } from "@/shared/lib/backup-engine";
import type { DryRunPreview, ImportMode } from "@/shared/lib/backup-schema";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence } from "motion/react";

export interface BackupRestoreViewProps {
  onBack?: () => void;
  className?: string;
}

export function BackupRestoreView({ onBack, className }: BackupRestoreViewProps) {
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

  const resetState = () => {
    setSelectedFileName(null);
    setDryRun(null);
    setImportMode("merge");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        resetState();
        onBack?.();
      }
    } catch (err: any) {
      toast.error("Gagal melakukan restorasi data lokal", {
        description: err.message || "Terjadi kesalahan. Snapshot awal telah dipulihkan.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle flex items-start gap-3.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
          <FileText size={22} weight="duotone" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">Cadangan & Pemulihan Data</h3>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Simpan data riwayat dan koleksi ke file JSON atau pulihkan data dari file cadangan.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!dryRun ? (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            <button
              type="button"
              onClick={handleExport}
              className="group relative w-full flex items-center gap-3.5 p-4 rounded-xl bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all text-left overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <div className="shrink-0 flex items-center justify-center size-11 rounded-lg bg-accent/10 text-accent group-hover:scale-105 transition-transform duration-200">
                <DownloadSimple size={22} weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text-primary truncate">Export Data JSON</h4>
                <p className="text-xs text-text-muted mt-0.5 truncate">Unduh cadangan data lokal ke file JSON</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-full flex items-center gap-3.5 p-4 rounded-xl bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all text-left overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <div className="shrink-0 flex items-center justify-center size-11 rounded-lg bg-accent/10 text-accent group-hover:scale-105 transition-transform duration-200">
                <UploadSimple size={22} weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text-primary truncate">Import File Cadangan</h4>
                <p className="text-xs text-text-muted mt-0.5 truncate">Pulihkan riwayat dan koleksi dari file JSON</p>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Selected File Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">File Terpilih</span>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-raised border border-border-subtle shadow-xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-accent" weight="duotone" />
                  </div>
                  <span className="text-xs font-bold text-text-primary truncate">{selectedFileName}</span>
                </div>
                <button 
                  type="button"
                  onClick={resetState} 
                  className="text-[11px] font-bold text-text-secondary hover:text-text-primary px-3 py-1 rounded-lg bg-surface-base border border-border-subtle hover:bg-surface-hover transition-colors shrink-0 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>

            {/* Validation State */}
            {dryRun.errors.length > 0 ? (
              <div className="p-4 rounded-2xl bg-semantic-error/10 border border-semantic-error/20 text-semantic-error shadow-xs">
                <span className="font-bold flex items-center gap-2 mb-2 text-sm">
                  <ShieldWarning size={20} weight="fill" /> File Tidak Valid ({dryRun.errors.length})
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-[12px] opacity-90 pl-1">
                  {dryRun.errors.slice(0, 3).map((err, idx) => (
                    <li key={idx} className="truncate">
                      <span className="font-mono bg-semantic-error/10 px-1 rounded">{err.path}</span>: {err.message}
                    </li>
                  ))}
                  {dryRun.errors.length > 3 && <li className="italic opacity-80 pt-1">+{dryRun.errors.length - 3} error lainnya</li>}
                </ul>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col justify-center p-3.5 rounded-2xl bg-surface-raised border border-border-subtle shadow-xs">
                    <span className="text-[11px] uppercase font-bold text-text-muted mb-0.5">Item Valid</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-text-primary">{dryRun.validLibraryCount + dryRun.validHistoryCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                      <span className="text-semantic-success bg-semantic-success/10 px-1.5 py-0.5 rounded-md">+{dryRun.addedCount} baru</span>
                      <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">{dryRun.replacedCount} update</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center p-3.5 rounded-2xl bg-surface-raised border border-border-subtle shadow-xs">
                    <span className="text-[11px] uppercase font-bold text-text-muted mb-0.5">Konflik / Duplikat</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-text-primary">{dryRun.existingConflictCount + dryRun.duplicateInPayloadCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                      <span className="text-semantic-warning bg-semantic-warning/10 px-1.5 py-0.5 rounded-md">{dryRun.existingConflictCount} konflik</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-1">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block pl-1">Mode Import</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImportMode("merge")}
                      className={cn(
                        "relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden outline-none cursor-pointer",
                        importMode === "merge"
                          ? "border-accent bg-accent/10 shadow-xs"
                          : "border-border-subtle bg-surface-raised hover:bg-surface-hover"
                      )}
                    >
                      <span className={cn("block text-xs font-bold", importMode === "merge" ? "text-accent" : "text-text-primary")}>Gabung Data</span>
                      <span className="block text-[11px] text-text-muted mt-1 leading-relaxed">
                        Data lama tetap aman. Tambahkan item baru.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode("replace")}
                      className={cn(
                        "relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden outline-none cursor-pointer",
                        importMode === "replace"
                          ? "border-semantic-error bg-semantic-error/10 shadow-xs"
                          : "border-border-subtle bg-surface-raised hover:bg-surface-hover"
                      )}
                    >
                      <span className={cn("block text-xs font-bold", importMode === "replace" ? "text-semantic-error" : "text-text-primary")}>Ganti Total</span>
                      <span className="block text-[11px] text-text-muted mt-1 leading-relaxed">
                        Hapus semua data lokal, timpa dari file cadangan.
                      </span>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleExecuteRestore}
                  disabled={isProcessing}
                  variant={importMode === "replace" ? "destructive" : "accent"}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-xs mt-1"
                >
                  {isProcessing ? "Memproses..." : "Pulihkan Data Sekarang"}
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface BackupRestoreModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupRestoreModal({ isOpen, onOpenChange }: BackupRestoreModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)] rounded-[28px] p-6 bg-surface-overlay/95 backdrop-blur-2xl border border-border-glass shadow-glass overflow-hidden flex flex-col gap-0">
        <DialogTitle className="sr-only">Cadangan & Pemulihan</DialogTitle>
        <DialogDescription className="sr-only">Ekspor atau impor data lokal Yomirra</DialogDescription>
        <BackupRestoreView onBack={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
