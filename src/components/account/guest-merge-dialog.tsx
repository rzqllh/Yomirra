"use client";

import * as React from "react";
import { useGuestMergeStore } from "@/shared/store/guest-merge-store";
import {
  executeGuestMerge,
  fetchCloudSnapshot,
  computeMergeDiff,
  MergeStrategy,
} from "@/shared/lib/guest-merge-engine";
import { useAuth } from "@/shared/hooks/use-auth";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";
import { Button } from "@/components/ui/button";
import {
  GitMerge,
  Warning,
  CheckCircle,
  Bookmarks,
  ClockCounterClockwise,
  CloudCheck,
  ShieldCheck,
  ArrowsClockwise,
  WarningCircle,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";

export function GuestMergeDialog() {
  const {
    isMergePending,
    pendingUser,
    guestSnapshot,
    cloudSnapshot,
    diff,
    mergeError,
    startMergeReview,
    resolveMergeReview,
    cancelMergeReview,
  } = useGuestMergeStore();

  const { logout } = useAuth();
  const [strategy, setStrategy] = React.useState<MergeStrategy>("merge");
  const [confirmedDestructive, setConfirmedDestructive] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [isRetryingSnapshot, setIsRetryingSnapshot] = React.useState(false);

  if (!isMergePending) {
    return null;
  }

  // Fail-closed snapshot error state
  if (mergeError) {
    const handleRetry = async () => {
      setIsRetryingSnapshot(true);
      try {
        const guestLib = useLibraryStore.getState().items || {};
        const guestHist = useHistoryStore.getState().items || {};
        const currentGuestSnapshot = { library: guestLib, history: guestHist };

        const fetchedCloud = await fetchCloudSnapshot(mergeError.user.uid);
        const computedDiff = computeMergeDiff(currentGuestSnapshot, fetchedCloud);

        startMergeReview({
          user: mergeError.user,
          guestSnapshot: currentGuestSnapshot,
          cloudSnapshot: fetchedCloud,
          diff: computedDiff,
        });
        toast.success("Snapshot Cloud Berhasil Dibaca");
      } catch (err: any) {
        toast.error("Gagal Membaca Cloud", {
          description: err?.message || "Koneksi cloud masih terganggu. Coba lagi sesaat lagi.",
        });
      } finally {
        setIsRetryingSnapshot(false);
      }
    };

    const handleCancelAuth = async () => {
      try {
        await logout();
      } finally {
        cancelMergeReview();
        toast.info("Masuk akun dibatalkan", {
          description: "Data lokal tetap terlindungi dan kamu kembali ke mode tamu.",
        });
      }
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-error-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-md rounded-2xl border border-status-error-fg/30 bg-surface-raised p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-status-error-bg/60 border border-status-error-fg/30 flex items-center justify-center text-status-error-fg shrink-0 mt-0.5">
              <WarningCircle size={22} weight="bold" />
            </div>
            <div>
              <h2 id="merge-error-title" className="text-base font-bold text-text-primary">
                Gagal Membaca Data Cloud
              </h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Yomirra mendeteksi akunmu memiliki sesi aktif, namun gagal membaca snapshot data cloud untuk verifikasi penggabungan: <strong className="text-status-error-fg">{mergeError.errorMessage}</strong>.
              </p>
              <p className="text-[11px] text-text-secondary mt-1.5">
                Data bacaan lokalmu di perangkat ini tetap aman dan tidak diubah. Sinkronisasi diblokir sampai data cloud berhasil diverifikasi.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelAuth}
              disabled={isRetryingSnapshot}
              className="w-full sm:w-auto flex-1 rounded-xl min-h-10 text-xs font-bold"
            >
              Batalkan Masuk Akun
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleRetry}
              loading={isRetryingSnapshot}
              className="w-full sm:w-auto flex-1 rounded-xl min-h-10 text-xs font-bold"
            >
              <ArrowClockwise size={16} weight="bold" className={cn(isRetryingSnapshot && "animate-spin")} />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!pendingUser || !guestSnapshot || !cloudSnapshot || !diff) {
    return null;
  }

  const guestLibCount = Object.keys(guestSnapshot.library || {}).length;
  const guestHistCount = Object.keys(guestSnapshot.history || {}).length;
  const cloudLibCount = Object.keys(cloudSnapshot.library || {}).length;
  const cloudHistCount = Object.keys(cloudSnapshot.history || {}).length;

  const handleCancel = async () => {
    try {
      await logout();
    } finally {
      cancelMergeReview();
      toast.info("Masuk akun dibatalkan", {
        description: "Data lokal tetap aman di perangkat ini tanpa perubahan apa pun.",
      });
    }
  };

  const handleApply = async () => {
    if (strategy === "cloud-replace" && !confirmedDestructive) {
      toast.error("Konfirmasi Diperlukan", {
        description: "Beri tanda centang pada kotak konfirmasi sebelum melanjutkan.",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const result = await executeGuestMerge({
        uid: pendingUser.uid,
        strategy,
        guestSnapshot,
        cloudSnapshot,
      });

      if (strategy === "merge") {
        useSyncDiagnosticsStore.getState().recordSuccessfulCommit({
          uid: pendingUser.uid,
          domains: [
            {
              domain: "library",
              successfulWriteCount: result.stats.actualCloudWrites > 0 ? guestLibCount : 0,
              verifiedReadCount: cloudLibCount,
            },
            {
              domain: "history",
              successfulWriteCount: result.stats.actualCloudWrites > 0 ? guestHistCount : 0,
              verifiedReadCount: cloudHistCount,
            },
          ],
        });
      } else {
        // Cloud-replace: cloud data adopted locally, 0 cloud writes
        useSyncDiagnosticsStore.getState().recordSuccessfulCommit({
          uid: pendingUser.uid,
          domains: [
            {
              domain: "library",
              successfulWriteCount: 0,
              verifiedReadCount: cloudLibCount,
            },
            {
              domain: "history",
              successfulWriteCount: 0,
              verifiedReadCount: cloudHistCount,
            },
          ],
        });
      }

      resolveMergeReview();
      toast.success(
        strategy === "merge" ? "Data Berhasil Digabungkan & Tersinkron!" : "Data Cloud Berhasil Diterapkan",
        {
          description:
            strategy === "merge"
              ? `${result.stats.libraryCount} komik dan ${result.stats.historyCount} riwayat berhasil diselaraskan dengan akun Google-mu.`
              : "Data akun Google telah diterapkan ke perangkat ini. Salinan cadangan sesi tamu tersimpan secara lokal.",
        }
      );
    } catch (err: any) {
      console.error("Failed to execute guest merge", err);
      toast.error("Penyelarasan Gagal", {
        description:
          err?.message || "Terjadi kesalahan saat memproses data. Data lokal telah dipulihkan ke kondisi semula.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-merge-title"
      aria-describedby="guest-merge-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border-default/80 bg-surface-raised p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0 mt-0.5">
            <GitMerge size={22} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="guest-merge-title" className="text-lg font-bold text-text-primary">
                Penyelarasan Data Tamu &amp; Akun
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                Q64 Terverifikasi
              </span>
            </div>
            <p id="guest-merge-desc" className="text-xs text-text-muted mt-1 leading-relaxed">
              Kamu telah masuk sebagai <strong className="text-text-primary">{pendingUser.displayName || pendingUser.email}</strong>.
              Terdapat data bacaan di perangkat ini dan di akun cloud. Pilih strategi penyelarasan sebelum melanjutkan.
            </p>
          </div>
        </div>

        {/* Snapshot Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-base/80 border border-border-subtle/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-text-secondary">
              <Bookmarks size={15} weight="duotone" className="text-accent" />
              <span>Data Lokal (Tamu)</span>
            </div>
            <div className="text-[11px] text-text-muted space-y-0.5">
              <p><strong className="text-text-primary">{guestLibCount}</strong> komik tersimpan</p>
              <p><strong className="text-text-primary">{guestHistCount}</strong> riwayat baca</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-base/80 border border-border-subtle/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-text-secondary">
              <CloudCheck size={16} weight="duotone" className="text-accent" />
              <span>Data Akun Cloud</span>
            </div>
            <div className="text-[11px] text-text-muted space-y-0.5">
              <p><strong className="text-text-primary">{cloudLibCount}</strong> komik di cloud</p>
              <p><strong className="text-text-primary">{cloudHistCount}</strong> riwayat di cloud</p>
            </div>
          </div>
        </div>

        {/* Diff & Conflict Highlight */}
        {diff.conflictingLibrary.length > 0 && (
          <div className="p-3 rounded-xl bg-status-info-bg/40 border border-status-info-fg/20 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-text-primary">
              <ShieldCheck size={16} weight="bold" className="text-accent" />
              <span>Resolusi Konflik Terverifikasi (Milestone Q52 &amp; Q63)</span>
            </div>
            <p className="text-[11.5px] text-text-secondary leading-relaxed">
              Ditemukan {diff.conflictingLibrary.length} komik tumpang-tindih. Jika memilih <strong>Gabungkan</strong>, Yomirra mempertahankan milestone tertinggi yang terverifikasi dan kursor chapter independen tanpa kehilangan progres bacaan.
            </p>
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
              {diff.conflictingLibrary.map((c) => (
                <div key={c.id} className="text-[11px] p-1.5 rounded bg-surface-base/60 border border-border-subtle/40 flex items-center justify-between">
                  <span className="font-semibold text-text-primary truncate max-w-[55%]">{c.title}</span>
                  <span className="text-[10px] text-accent font-medium">{c.resolvedMilestoneChapter}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-text-primary block">
            Pilih Strategi Penyelarasan:
          </label>

          <button
            type="button"
            onClick={() => {
              setStrategy("merge");
              setConfirmedDestructive(false);
            }}
            className={cn(
              "w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3",
              strategy === "merge"
                ? "bg-accent/10 border-accent text-text-primary shadow-xs"
                : "bg-surface-base/50 border-border-subtle/80 hover:bg-surface-hover/50 text-text-secondary"
            )}
          >
            <div className="mt-0.5">
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  strategy === "merge" ? "border-accent bg-accent" : "border-border-default"
                )}
              >
                {strategy === "merge" && <div className="size-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">
                  1. Gabungkan Data (Direkomendasikan)
                </span>
                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-status-success-bg text-status-success-fg border border-status-success-fg/30">
                  Aman
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Menyatukan rak buku dan riwayat. Komik dan chapter yang sama dipadukan dengan mempertahankan progres tertinggi (Q52) dan kursor mandiri (Q63).
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStrategy("cloud-replace")}
            className={cn(
              "w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3",
              strategy === "cloud-replace"
                ? "bg-status-warning-bg/30 border-status-warning-fg/60 text-text-primary shadow-xs"
                : "bg-surface-base/50 border-border-subtle/80 hover:bg-surface-hover/50 text-text-secondary"
            )}
          >
            <div className="mt-0.5">
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  strategy === "cloud-replace" ? "border-status-warning-fg bg-status-warning-fg" : "border-border-default"
                )}
              >
                {strategy === "cloud-replace" && <div className="size-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">
                  2. Gunakan Data Cloud (Timpa Data Lokal)
                </span>
                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-status-warning-bg text-status-warning-fg border border-status-warning-fg/30">
                  Destruktif
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Abaikan data yang dibuat selama sesi tamu di perangkat ini, dan gunakan data akun Google sepenuhnya. Salinan cadangan sesi tamu akan disimpan secara lokal.
              </p>
            </div>
          </button>
        </div>

        {/* Destructive Safeguard Confirmation */}
        {strategy === "cloud-replace" && (
          <div className="p-3 rounded-xl bg-status-warning-bg/40 border border-status-warning-fg/30 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-status-warning-fg">
              <Warning size={16} weight="bold" />
              <span>Konfirmasi Tindakan Destruktif</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Tindakan ini akan menggantikan data sesi tamu lokal dengan data akun Google. Cadangan lokal otomatis dibuat sebelum penggantian.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                id="confirm-destructive-checkbox"
                checked={confirmedDestructive}
                onChange={(e) => setConfirmedDestructive(e.target.checked)}
                className="mt-0.5 rounded border-border-default text-accent focus:ring-accent"
              />
              <span className="text-[11px] font-semibold text-text-primary">
                Saya mengerti bahwa data lokal sesi tamu akan digantikan data cloud.
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isExecuting}
            className="w-full sm:w-auto flex-1 rounded-xl min-h-11 text-xs font-bold"
          >
            Batalkan Masuk Akun
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            loading={isExecuting}
            disabled={strategy === "cloud-replace" && !confirmedDestructive}
            className="w-full sm:w-auto flex-1 rounded-xl min-h-11 text-xs font-bold"
          >
            <ArrowsClockwise size={16} weight="bold" className={cn(isExecuting && "animate-spin")} />
            Terapkan &amp; Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}
