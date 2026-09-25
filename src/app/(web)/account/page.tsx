"use client";

import * as React from "react";
import { PageHeader } from "@/components/app/header";
import { useAuth } from "@/shared/hooks/use-auth";
import { useSync } from "@/shared/hooks/use-sync";
import { useSettingsStore } from "@/shared/store/settings-store";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  CloudCheck,
  ArrowsClockwise,
  SignOut,
  GoogleLogo,
  ShieldCheck,
  DeviceMobile,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";

export default function AccountPage() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { runFullSync, isSyncing } = useSync({ autoSync: false });
  const lastSyncedAt = useSettingsStore((state) => state.lastSyncedAt);

  const handleSyncNow = async () => {
    if (!user) return;
    try {
      await runFullSync();
      toast.success("Sinkronisasi cloud berhasil diselesaikan");
    } catch {
      toast.error("Gagal melakukan sinkronisasi cloud");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Berhasil keluar dari akun");
    } catch {
      toast.error("Gagal keluar dari akun");
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
      <div className="max-w-5xl mx-auto px-4 md:px-8 md:pt-8">
        <PageHeader
          title="Akun & Sinkronisasi"
          showBack={true}
          backHref="/settings"
          description="Kelola profil pembaca dan sinkronisasi data cloud Firebase"
        />
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-0 space-y-6 md:space-y-8">
        {/* Profile Card */}
        {user ? (
          <div className="rounded-[28px] border border-border-glass bg-surface-glass backdrop-blur-2xl p-6 shadow-glass flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="size-20 rounded-xl overflow-hidden border border-border-default/60 shrink-0 bg-surface-raised shadow-xs flex items-center justify-center">
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
                  <ShieldCheck size={12} weight="bold" /> Google Auth
                </span>
              </div>
              <p className="text-sm text-text-muted truncate mt-1">
                {user.email || "Tidak ada email"}
              </p>
              <p className="text-xs text-text-secondary/70 mt-2">
                UID: <span className="font-mono text-[11px]">{user.uid}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-border-glass bg-surface-glass backdrop-blur-2xl p-6 shadow-glass text-center space-y-4">
            <div className="size-16 mx-auto rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <UserCircle size={36} weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Masuk ke Akun Yomirra
              </h2>
              <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
                Sinkronkan rak buku, progres baca, dan koleksi pribadi Anda di semua perangkat secara real-time.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={loginWithGoogle}
              loading={authLoading}
              className="w-full max-w-xs mx-auto"
            >
              <GoogleLogo size={18} weight="bold" />
              Masuk dengan Google
            </Button>
          </div>
        )}

        {/* Cloud Sync Section */}
        {user && (
          <div className="rounded-[28px] border border-border-glass bg-surface-glass backdrop-blur-2xl p-6 shadow-glass space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <CloudCheck size={22} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Status Sinkronisasi Cloud
                  </h3>
                  <p className="text-xs text-text-muted">
                    Terakhir disinkronkan: {formatLastSync(lastSyncedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised/50 border border-border-subtle/40 text-xs text-text-secondary space-y-2">
              <div className="flex items-center justify-between">
                <span>Database Cloud:</span>
                <span className="font-bold text-text-primary">Firebase Firestore</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Data yang Disinkronkan:</span>
                <span className="font-bold text-text-primary">Library, History, Koleksi</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="default"
              onClick={handleSyncNow}
              loading={isSyncing}
              className="w-full rounded-xl"
            >
              <ArrowsClockwise
                size={18}
                weight="bold"
                className={cn(isSyncing && "animate-spin")}
              />
              {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
            </Button>
          </div>
        )}

        {/* Device & PWA Status */}
        <div className="rounded-[28px] border border-border-glass bg-surface-glass backdrop-blur-2xl p-6 shadow-glass space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center text-text-secondary shrink-0">
              <DeviceMobile size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Penyimpanan Lokal Perangkat
              </h3>
              <p className="text-xs text-text-muted">
                Data disimpan di IndexedDB & LocalStorage perangkat ini
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {user && (
          <div className="rounded-[28px] border border-semantic-error/20 bg-semantic-error/5 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-semantic-error">
                Keluar dari Akun
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Data lokal perangkat akan tetap ada dan akan disinkronkan kembali saat Anda masuk.
              </p>
            </div>
            <Button
              variant="destructive"
              size="default"
              onClick={handleLogout}
              className="w-full rounded-xl"
            >
              <SignOut size={18} weight="bold" />
              Keluar dari Akun
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
