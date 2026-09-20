"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CloudArrowUp, X, GoogleLogo, HardDrives } from "@phosphor-icons/react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useLibraryStore } from "@/shared/store/library-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useMounted } from "@/shared/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";

export interface GuestSyncBannerProps {
  className?: string;
}

export function GuestSyncBanner({ className }: GuestSyncBannerProps) {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const libraryItems = useLibraryStore((state) => state.items);
  const readingStatusByManga = useCollectionStore((state) => state.readingStatusByManga);
  const guestBannerSnoozedUntil = useSettingsStore((state) => state.guestBannerSnoozedUntil);
  const guestBannerDismissCount = useSettingsStore((state) => state.guestBannerDismissCount);
  const dismissGuestBanner = useSettingsStore((state) => state.dismissGuestBanner);

  const mounted = useMounted();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Compute unique title count across saved library items and reading status
  const totalItemCount = React.useMemo(() => {
    const keys = new Set<string>();
    if (libraryItems) {
      Object.keys(libraryItems).forEach((k) => keys.add(k));
    }
    if (readingStatusByManga) {
      Object.keys(readingStatusByManga).forEach((k) => keys.add(k));
    }
    return keys.size;
  }, [libraryItems, readingStatusByManga]);

  // Determine visibility based on conditions
  const isVisible = React.useMemo(() => {
    if (!mounted || authLoading) return false;
    // Hide if user is already authenticated
    if (user) return false;
    // Only show if guest has at least 5 items
    if (totalItemCount < 5) return false;
    // Check if snooze is currently active
    if (guestBannerSnoozedUntil && Date.now() < guestBannerSnoozedUntil) {
      return false;
    }
    return true;
  }, [mounted, authLoading, user, totalItemCount, guestBannerSnoozedUntil]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      toast.success("Berhasil masuk. Data kamu sedang disinkronkan ke cloud.");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error("Gagal masuk dengan Google. Silakan coba lagi.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDismiss = () => {
    dismissGuestBanner(totalItemCount);
    const isEscalated = totalItemCount >= 15 && guestBannerDismissCount > 0;
    const days = isEscalated ? 3 : 7;
    toast.info(`Pengingat disembunyikan selama ${days} hari.`);
  };

  if (!isVisible) return null;

  const isEscalated = totalItemCount >= 15 && guestBannerDismissCount > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("w-full mb-4 md:mb-6", className)}
      >
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface-raised/90 backdrop-blur-xl p-4 sm:p-5 shadow-xs transition-all">
          {/* Subtle accent glow in the corner */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Icon and Text Information */}
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <div className="size-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                <CloudArrowUp size={22} weight="duotone" />
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-accent/15 text-accent border border-accent/25">
                    {isEscalated ? `${totalItemCount} Judul Tersimpan` : "Penyimpanan Lokal"}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <HardDrives size={12} weight="bold" />
                    Hanya di Browser Ini
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  {isEscalated
                    ? "Koleksimu makin banyak di browser ini"
                    : `${totalItemCount} komik tersimpan di browser ini`}
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                  {isEscalated
                    ? "Semua riwayat bacaan, status, dan koleksimu saat ini belum terhubung ke akun. Data ini cuma tersimpan di browser/HP ini — kalau ganti device, nggak ikut kebawa. Hubungkan akun Google untuk backup otomatis."
                    : "Data komik di rak bukumu saat ini cuma tersimpan di browser perangkat ini — kalau ganti device atau bersihkan browser, nggak ikut kebawa. Masuk dengan Google untuk pencadangan otomatis."}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="h-9 px-3 text-xs font-semibold rounded-xl text-text-muted hover:text-text-primary border-border-subtle hover:bg-surface-hover"
                title={isEscalated ? "Snooze 3 hari" : "Snooze 7 hari"}
              >
                Nanti saja
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleLogin}
                loading={isLoggingIn}
                className="h-9 px-3.5 text-xs font-bold rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
              >
                <GoogleLogo size={14} weight="bold" />
                <span>Cadangkan ke Akun</span>
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Tutup pengingat"
                className="hidden sm:flex size-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors ml-1"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
