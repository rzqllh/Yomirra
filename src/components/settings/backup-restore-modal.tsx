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
      <DialogContent className="max-w-md w-[calc(100vw-32px)] rounded-[28px] p-0 bg-surface-overlay/95 backdrop-blur-2xl border border-border-glass shadow-glass overflow-hidden flex flex-col gap-0">
        
        {/* Header Section */}
        <div className="px-6 pt-6 pb-5 bg-surface-base/50 border-b border-border-subtle/40">
          <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-accent/15 flex items-center justify-center">
              <FileText size={18} weight="fill" className="text-accent" />
            </div>
            Backup & Restore
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-text-secondary mt-2.5">
            Simpan koleksi lokal Anda ke JSON atau pulihkan data dari file backup resmi Yomirra (v1).
          </DialogDescription>
        </div>

        <div className="p-6 relative bg-surface-base/20">
          <AnimatePresence mode="wait">
            {!dryRun ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col gap-3"
              >
                <button
                  onClick={handleExport}
                  className="group relative w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all text-left overflow-hidden outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="shrink-0 flex items-center justify-center size-12 rounded-full bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
                    <DownloadSimple size={24} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-text-primary truncate">Export Data JSON</h3>
                    <p className="text-[13px] text-text-muted mt-0.5 truncate">Download backup data lokal</p>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all text-left overflow-hidden outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="shrink-0 flex items-center justify-center size-12 rounded-full bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <UploadSimple size={24} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-text-primary truncate">Import File Backup</h3>
                    <p className="text-[13px] text-text-muted mt-0.5 truncate">Pulihkan data dari file JSON</p>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="w-full rounded-xl font-bold h-12 mt-2 text-text-secondary hover:text-text-primary"
                >
                  Tutup
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col gap-5"
              >
                {/* Selected File Box */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">File Terpilih</span>
                  <div className="flex items-center justify-between p-3 rounded-[18px] bg-surface-raised border border-border-subtle shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-accent" weight="duotone" />
                      </div>
                      <span className="text-[13px] font-bold text-text-primary truncate">{selectedFileName}</span>
                    </div>
                    <button 
                      onClick={resetState} 
                      className="text-[11px] font-bold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-full bg-surface-base border border-border-subtle hover:bg-surface-hover transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Batal
                    </button>
                  </div>
                </div>

                {/* Validation State */}
                {dryRun.errors.length > 0 ? (
                  <div className="p-4 rounded-[20px] bg-semantic-error/10 border border-semantic-error/20 text-semantic-error shadow-sm">
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
                      <div className="flex flex-col justify-center p-3.5 rounded-[20px] bg-surface-raised border border-border-subtle shadow-sm">
                        <span className="text-[11px] uppercase font-bold text-text-muted mb-0.5">Item Valid</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-text-primary">{dryRun.validLibraryCount + dryRun.validHistoryCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                          <span className="text-semantic-success bg-semantic-success/10 px-1.5 py-0.5 rounded-md">+{dryRun.addedCount} baru</span>
                          <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">{dryRun.replacedCount} update</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center p-3.5 rounded-[20px] bg-surface-raised border border-border-subtle shadow-sm">
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
                          onClick={() => setImportMode("merge")}
                          className={cn(
                            "relative p-3.5 rounded-[20px] border text-left transition-all overflow-hidden outline-none focus-visible:ring-2",
                            importMode === "merge"
                              ? "border-accent bg-accent/10 focus-visible:ring-accent shadow-sm"
                              : "border-border-subtle bg-surface-raised hover:bg-surface-hover focus-visible:ring-accent"
                          )}
                        >
                          {importMode === "merge" && <div className="absolute top-0 right-0 w-10 h-10 bg-accent/20 rounded-bl-3xl" />}
                          <span className={cn("block text-[13px] font-bold", importMode === "merge" ? "text-accent" : "text-text-primary")}>Gabung Data</span>
                          <span className="block text-[11px] text-text-muted mt-1 leading-relaxed">
                            Data lama tetap aman. Perbarui item baru.
                          </span>
                        </button>
                        <button
                          onClick={() => setImportMode("replace")}
                          className={cn(
                            "relative p-3.5 rounded-[20px] border text-left transition-all overflow-hidden outline-none focus-visible:ring-2",
                            importMode === "replace"
                              ? "border-semantic-error bg-semantic-error/10 focus-visible:ring-semantic-error shadow-sm"
                              : "border-border-subtle bg-surface-raised hover:bg-surface-hover focus-visible:ring-accent"
                          )}
                        >
                          {importMode === "replace" && <div className="absolute top-0 right-0 w-10 h-10 bg-semantic-error/20 rounded-bl-3xl" />}
                          <span className={cn("block text-[13px] font-bold", importMode === "replace" ? "text-semantic-error" : "text-text-primary")}>Ganti Total</span>
                          <span className="block text-[11px] text-text-muted mt-1 leading-relaxed">
                            Hapus semua lokal, timpa dari backup.
                          </span>
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleExecuteRestore}
                      disabled={isProcessing}
                      variant={importMode === "replace" ? "destructive" : "accent"}
                      className="w-full h-[52px] rounded-2xl font-bold text-[15px] shadow-sm mt-1"
                    >
                      {isProcessing ? "Memproses..." : "Pulihkan Data Sekarang"}
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
