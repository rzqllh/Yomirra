"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, FolderPlus, GoogleLogo, DeviceMobile } from "@phosphor-icons/react";
import { useAuth } from "@/shared/hooks/use-auth";
import { toast } from "sonner";

export type GuestActionType = "rating" | "collection";

export interface GuestActionGateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: GuestActionType;
  titleContext?: string;
  onProceedAsGuest: () => void;
  onLoginSuccess?: () => void;
}

export function GuestActionGateModal({
  isOpen,
  onOpenChange,
  actionType,
  titleContext,
  onProceedAsGuest,
  onLoginSuccess,
}: GuestActionGateModalProps) {
  const { loginWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      toast.success("Berhasil masuk dengan akun Google");
      onOpenChange(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        onProceedAsGuest();
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error("Gagal masuk dengan Google. Silakan coba lagi.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleProceedGuest = () => {
    onOpenChange(false);
    onProceedAsGuest();
  };

  const isRating = actionType === "rating";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // If closed via backdrop or close button, still execute the local action as specified
          handleProceedGuest();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="max-w-sm sm:max-w-md p-5 sm:p-6 rounded-[24px] border border-border-glass bg-surface-overlay/95 backdrop-blur-2xl shadow-glass">
        <DialogHeader className="gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${isRating
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-accent/10 border-accent/20 text-accent"
                }`}
            >
              {isRating ? (
                <Star size={22} weight="fill" />
              ) : (
                <FolderPlus size={22} weight="duotone" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                {isRating ? "Rating Personal" : "Koleksi Kustom"}
              </span>
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <DeviceMobile size={13} weight="bold" />
                Mode Tamu (Penyimpanan Lokal)
              </span>
            </div>
          </div>

          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-text-primary mt-1">
            {isRating
              ? titleContext
                ? `Biar rating ${titleContext} kamu nggak hilang pas ganti device`
                : "Biar rating komik kamu nggak hilang pas ganti device"
              : "Bikin playlist komikmu aman di cloud"}
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-text-muted leading-relaxed">
            {isRating
              ? "Rating ini baru nempel di browser ini doang. Masuk pake Google biar selera komik & skor yang kamu kasih otomatis kebawa ke mana pun kamu baca."
              : "Udah rapihin folder bacaan, jangan sampai hilang pas ganti HP. Masuk pake Google biar daftar koleksi komikmu otomatis sinkron ke semua device."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 mt-2 pt-3 border-t border-border-subtle/50">
          <Button
            variant="default"
            size="default"
            onClick={handleLogin}
            loading={isLoggingIn}
            className="w-full h-11 rounded-xl font-bold bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-transform"
          >
            <GoogleLogo size={18} weight="bold" />
            <span>{isRating ? "Simpan ke Akun (Google)" : "Amankan Pake Google"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={handleProceedGuest}
            disabled={isLoggingIn}
            className="w-full h-10 rounded-xl font-medium text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover/70"
          >
            {isRating ? "Lanjut di Device Ini Aja" : "Bikin di Device Ini Dulu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
