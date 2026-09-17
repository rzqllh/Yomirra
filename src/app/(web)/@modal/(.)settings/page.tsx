"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { motion } from "motion/react";
import { transitions } from "@/shared/lib/motion/tokens";

export default function SettingsInterceptedModalPage() {
  const router = useRouter();

  const handleClose = React.useCallback(() => {
    router.back();
  }, [router]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10 cursor-pointer"
      />

      {/* Modal Surface */}
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={transitions.smooth}
        className="relative z-10 w-full max-w-2xl bg-surface-base border-t sm:border border-border-subtle rounded-t-[32px] sm:rounded-[28px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <SettingsView isOverlay onClose={handleClose} />
      </motion.div>
    </div>
  );
}
