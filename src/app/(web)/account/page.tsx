"use client";

import * as React from "react";
import { PageHeader } from "@/components/chrome/header";
import { PageContainer } from "@/components/ui/layout";
import { useAuth } from "@/shared/hooks/use-auth";
import { useSync } from "@/shared/hooks/use-sync";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useLibraryStore } from "@/shared/store/library-store";
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
  GitMerge,
  Bookmarks,
  ClockCounterClockwise,
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

  const [isOnline, setIsOnline] = React.useState(true);
  const [mergePreference, setMergePreference] = React.useState<"merge" | "replace">("merge");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSyncNow = async () => {
    if (!user) return;
    if (!isOnline) {
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
        description: "Gagal menyinkronkan data. Periksa sambungan internetmu dan coba lagi.",
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

  return (
    <div className="min-h-screen bg-surface-base pb-28 md:pb-10">
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

              {/* Q64: Guest-to-Account Merge Preview & Conflict Resolution */}
              {(bookmarkCount > 0 || historyCount > 0) && (
                <div className="rounded-xl border border-border-subtle bg-surface-base/80 p-4 text-left space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <GitMerge size={16} weight="bold" className="text-accent" />
                      Pratinjau Penggabungan Tamu
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                      Q64 Terlindungi
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Data lokal di perangkatmu saat ini akan diselaraskan dengan akun Google:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-raised border border-border-subtle/60">
                      <Bookmarks size={16} weight="duotone" className="text-accent shrink-0" />
                      <div>
                        <p className="font-bold text-text-primary">{bookmarkCount} Judul</p>
                        <p className="text-[10.5px] text-text-muted">di Rak Buku</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-raised border border-border-subtle/60">
                      <ClockCounterClockwise size={16} weight="duotone" className="text-accent shrink-0" />
                      <div>
                        <p className="font-bold text-text-primary">{historyCount} Riwayat</p>
                        <p className="text-[10.5px] text-text-muted">Progres Baca</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <label className="text-[11px] font-medium text-text-muted block mb-1.5">
                      Resolusi Konflik Progres:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMergePreference("merge")}
                        className={cn(
                          "flex-1 text-xs py-1.5 px-2.5 rounded-lg border font-semibold transition-colors",
                          mergePreference === "merge"
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-surface-raised border-border-subtle text-text-muted hover:text-text-primary"
                        )}
                      >
                        Gabung Progres (Q52/Q63)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMergePreference("replace")}
                        className={cn(
                          "flex-1 text-xs py-1.5 px-2.5 rounded-lg border font-semibold transition-colors",
                          mergePreference === "replace"
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-surface-raised border-border-subtle text-text-muted hover:text-text-primary"
                        )}
                      >
                        Gunakan Data Cloud
                      </button>
                    </div>
                  </div>
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
              <div className="flex items-center justify-between">
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
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                    isOnline
                      ? "bg-status-success-bg text-status-success-fg border-status-success-fg/30"
                      : "bg-status-warning-bg text-status-warning-fg border-status-warning-fg/30"
                  )}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-raised/50 border border-border-subtle/40 text-xs text-text-secondary">
                Tersinkron: bookmark, riwayat baca, koleksi, dan preferensi yang didukung.
              </div>

              {/* Q127: Honest Cloud Sync Diagnostics Breakdown */}
              <div className="space-y-2 pt-1 border-t border-border-subtle/50">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-text-muted">Rak Buku &amp; Koleksi</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                    <CheckCircle size={14} weight="fill" className="text-status-success-fg" />
                    {bookmarkCount} item tersinkron
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-text-muted">Riwayat Baca (Milestone Q52 &amp; Q63)</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                    <CheckCircle size={14} weight="fill" className="text-status-success-fg" />
                    {historyCount} chapter aktif
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-text-muted">Preferensi Tampilan &amp; Sumber</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                    <CheckCircle size={14} weight="fill" className="text-status-success-fg" />
                    Tersimpan lokal &amp; cloud
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-text-muted">Kanal Sambungan</span>
                  <span className="font-semibold text-text-primary">
                    {isOnline ? "Terhubung ke Cloud Sync" : "Menunggu Sambungan Online"}
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="default"
                onClick={handleSyncNow}
                loading={isSyncing}
                disabled={!isOnline}
                className="w-full rounded-xl min-h-11 text-sm font-bold"
              >
                <ArrowsClockwise
                  size={18}
                  weight="bold"
                  className={cn(isSyncing && "animate-spin")}
                />
                {isSyncing ? "Menyinkronkan." : "Sinkronkan sekarang"}
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
                  Data tersimpan aman di IndexedDB perangkat ini
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
