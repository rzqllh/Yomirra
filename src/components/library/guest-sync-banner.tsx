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
      toast.success("Akun tersambung. Rak bacaanmu sekarang bisa ikut ke perangkat lain.");
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
    const msg = isEscalated ? "Oke, kami ingatkan lagi dalam 3 hari." : "Oke, kami ingatkan lagi minggu depan.";
    toast.info(msg);
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
        <div className="rounded-[16px] border border-border-default bg-surface-raised p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <div className="size-11 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <CloudArrowUp size={22} weight="duotone" />
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-accent">
                    {isEscalated ? `${totalItemCount} judul tersimpan` : "Rak bacaan tamu"}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <HardDrives size={16} weight="bold" aria-hidden="true" />
                    Hanya di perangkat ini
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  {isEscalated ? "Bawa rak bacaanmu ke perangkat lain" : "Simpan rak bacaanmu di akun"}
                </h3>

                <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                  {totalItemCount} komik tersimpan di browser ini. Masuk dengan Google agar rak bacaanmu tersedia saat kamu berganti perangkat.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="text-text-secondary"
                title={isEscalated ? "Ingatkan dalam 3 hari" : "Ingatkan minggu depan"}
              >
                Nanti saja
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleLogin}
                loading={isLoggingIn}
              >
                <GoogleLogo size={18} weight="bold" />
                <span>Masuk dengan Google</span>
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Tutup pengingat"
                className="hidden sm:flex size-11 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent transition-colors ml-1"
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
