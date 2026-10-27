"use client";

import * as React from "react";
import { PageHeader } from "@/components/chrome/header";
import { PageContainer } from "@/components/ui/layout";
import { useAuth } from "@/shared/hooks/use-auth";
import { useSync } from "@/shared/hooks/use-sync";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";
import { GuestMergeDialog } from "@/components/account/guest-merge-dialog";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  CloudCheck,
  ArrowsClockwise,
  SignOut,
  GoogleLogo,
  ShieldCheck,
  DeviceMobile,
  CheckCircle,
  Clock,
  WarningCircle,
  Bookmarks,
  ClockCounterClockwise,
  WifiHigh,
  WifiSlash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";

export default function AccountPage() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { runFullSync, isSyncing } = useSync({ autoSync: false });
  const lastSyncedAt = useSettingsStore((state) => state.lastSyncedAt);

  const historyItems = useHistoryStore((state) => state.items);
  const bookmarkItems = useLibraryStore((state) => state.items);
  const historyCount = Object.keys(historyItems || {}).length;
  const bookmarkCount = Object.keys(bookmarkItems || {}).length;

  const {
    lifecycleState,
    networkOnline,
    cloudReachable,
    domainRecords,
    lastSyncError,
  } = useSyncDiagnosticsStore();

  const handleSyncNow = async () => {
    if (!user) return;
    if (!networkOnline) {
      toast.warning("Koneksi offline", {
        description: "Tidak dapat menyinkronkan data saat offline. Data tersimpan aman di perangkat lokal.",
      });
      return;
    }
    try {
      await runFullSync();
      toast.success("Sinkronisasi selesai", {
        description: "Data bacaan lokal telah diperbarui dan diselaraskan dengan akun.",
      });
    } catch {
      toast.error("Sinkronisasi gagal", {
        description: "Gagal menyinkronkan data ke Cloud. Periksa sambungan internetmu dan coba lagi.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.info("Berhasil keluar", {
        description: "Kamu telah keluar dari akun dengan aman.",
      });
    } catch {
      toast.error("Gagal keluar", {
        description: "Terjadi gangguan saat memproses keluar akun. Coba sesaat lagi.",
      });
    }
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return "Belum pernah disinkronkan";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const libRecord = domainRecords["library"];
  const histRecord = domainRecords["history"];

  return (
    <div className="min-h-screen bg-surface-base pb-28 md:pb-10">
      <GuestMergeDialog />

      <PageContainer hasMobileHeader>
        <PageHeader
          title="Akun & Sinkronisasi"
          showBack={true}
          backHref="/settings"
          description="Kelola akun dan sinkronisasi bacaanmu."
        />

        <main className="w-full space-y-6 md:space-y-8">
          {/* Profile Card */}
          {user ? (
            <div className="rounded-2xl border border-border-default/80 bg-surface-raised p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="size-20 rounded-2xl overflow-hidden border border-border-default/60 shrink-0 bg-surface-raised shadow-xs flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCircle size={48} weight="duotone" className="text-accent" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-text-primary truncate">
                    {user.displayName || "Pembaca Yomirra"}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-md border border-accent/25">
                    <ShieldCheck size={12} weight="bold" /> Terhubung dengan Google
                  </span>
                </div>
                <p className="text-sm text-text-muted truncate mt-1">
                  {user.email || "Tidak ada email"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border-default/80 bg-surface-raised p-5 sm:p-6 shadow-xs text-center space-y-5">
              <div className="size-16 mx-auto rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <UserCircle size={36} weight="duotone" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Masuk ke Yomirra
                </h2>
                <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
                  Sinkronkan rak buku, progres baca, dan koleksimu di semua perangkat.
                </p>
              </div>

              {/* Guest Session Notice (Q64 Protected) */}
              {(bookmarkCount > 0 || historyCount > 0) && (
                <div className="rounded-xl border border-border-subtle bg-surface-base/80 p-4 text-left space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Bookmarks size={16} weight="duotone" className="text-accent" />
                      Data Sesi Tamu Tersedia
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-status-success-bg text-status-success-fg border border-status-success-fg/30">
                      Q64 Terlindungi
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Kamu memiliki <strong className="text-text-primary">{bookmarkCount} judul</strong> di rak buku dan <strong className="text-text-primary">{historyCount} riwayat</strong> baca lokal. Saat kamu masuk, kamu dapat meninjau diff dan memilih strategi penggabungan tanpa risiko data tertimpa atau hilang.
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={loginWithGoogle}
                loading={authLoading}
                className="w-full max-w-xs mx-auto min-h-11 text-sm font-bold"
              >
                <GoogleLogo size={18} weight="bold" />
                Masuk dengan Google
              </Button>
            </div>
          )}

          {/* Cloud Sync Section */}
          {user && (
            <div className="rounded-2xl border border-border-default/80 bg-surface-raised p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <CloudCheck size={22} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      Sinkronisasi cloud
                    </h3>
                    <p className="text-xs text-text-muted">
                      Terakhir disinkronkan: {formatLastSync(lastSyncedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-flex items-center gap-1",
                      networkOnline
                        ? "bg-status-success-bg text-status-success-fg border-status-success-fg/30"
                        : "bg-status-warning-bg text-status-warning-fg border-status-warning-fg/30"
                    )}
                  >
                    {networkOnline ? <WifiHigh size={12} weight="bold" /> : <WifiSlash size={12} weight="bold" />}
                    {networkOnline ? "Online" : "Offline"}
                  </span>

                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                      lifecycleState === "successful commit"
                        ? "bg-status-success-bg text-status-success-fg border-status-success-fg/30"
                        : lifecycleState === "syncing"
                        ? "bg-status-info-bg text-status-info-fg border-status-info-fg/30"
                        : lifecycleState === "failed"
                        ? "bg-status-error-bg text-status-error-fg border-status-error-fg/30"
                        : "bg-surface-base text-text-muted border-border-default"
                    )}
                  >
                    {lifecycleState === "successful commit"
                      ? "Tersinkron"
                      : lifecycleState === "syncing"
                      ? "Menyinkronkan…"
                      : lifecycleState === "failed"
                      ? "Gagal"
                      : lifecycleState === "offline"
                      ? "Offline"
                      : "Siap"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-raised/50 border border-border-subtle/40 text-xs text-text-secondary">
                Tersinkron: bookmark, riwayat baca, koleksi, dan preferensi yang didukung.
              </div>

              {/* Q127: Honest Cloud Sync Diagnostics Breakdown */}
              <div className="space-y-2.5 pt-1 border-t border-border-subtle/50 text-xs">
                {/* Domain: Library */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Rak Buku &amp; Koleksi</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
                    {libRecord && libRecord.status === "synced" ? (
                      <>
                        <CheckCircle size={14} weight="fill" className="text-status-success-fg" />
                        <span>{libRecord.committedCount} item terverifikasi di cloud</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} weight="bold" className="text-text-muted" />
                        <span className="text-text-muted">Menunggu sinkronisasi</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Domain: History */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Riwayat Baca (Milestone Q52 &amp; Q63)</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
                    {histRecord && histRecord.status === "synced" ? (
                      <>
                        <CheckCircle size={14} weight="fill" className="text-status-success-fg" />
                        <span>{histRecord.committedCount} riwayat terverifikasi di cloud</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} weight="bold" className="text-text-muted" />
                        <span className="text-text-muted">Menunggu sinkronisasi</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Connection Channel: Network Connectivity vs Firebase Reachability */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Kanal Jaringan (Network)</span>
                  <span className="font-semibold text-text-primary">
                    {networkOnline ? "Koneksi Internet Aktif" : "Perangkat Offline"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Akses Cloud (Firebase)</span>
                  <span className="font-semibold text-text-primary">
                    {cloudReachable === true
                      ? "Terhubung ke Firebase Cloud"
                      : cloudReachable === false
                      ? "Tidak Dapat Menjangkau Server"
                      : "Menunggu Operasi Pertama"}
                  </span>
                </div>

                {lastSyncError && (
                  <div className="p-2.5 rounded-xl bg-status-error-bg/30 border border-status-error-fg/30 text-[11px] text-status-error-fg flex items-start gap-1.5">
                    <WarningCircle size={14} weight="bold" className="shrink-0 mt-0.5" />
                    <span>Error sinkronisasi terakhir: {lastSyncError}</span>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                size="default"
                onClick={handleSyncNow}
                loading={isSyncing}
                disabled={!networkOnline}
                className="w-full rounded-xl min-h-11 text-sm font-bold"
              >
                <ArrowsClockwise
                  size={18}
                  weight="bold"
                  className={cn(isSyncing && "animate-spin")}
                />
                {isSyncing ? "Menyinkronkan…" : "Sinkronkan sekarang"}
              </Button>
            </div>
          )}

          {/* Device & PWA Status */}
          <div className="rounded-2xl border border-border-default/80 bg-surface-raised p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center text-text-secondary shrink-0">
                <DeviceMobile size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Penyimpanan Lokal Perangkat
                </h3>
                <p className="text-xs text-text-muted">
                  Data tersimpan aman di IndexedDB perangkat ini ({bookmarkCount} buku, {historyCount} riwayat)
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {user && (
            <div className="rounded-[28px] border border-semantic-error/20 bg-semantic-error/5 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-semantic-error">
                  Keluar
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Data di perangkat tetap ada dan bisa disinkronkan lagi saat kamu masuk.
                </p>
              </div>
              <Button
                variant="destructive"
                size="default"
                onClick={handleLogout}
                className="w-full rounded-xl min-h-11 text-sm font-bold"
              >
                <SignOut size={18} weight="bold" />
                Keluar
              </Button>
            </div>
          )}
        </main>
      </PageContainer>
    </div>
  );
}
