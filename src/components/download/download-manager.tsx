"use client";

import { useEffect, useState } from "react";
import { useDownloadStore } from "@/shared/store/download-store";
import { useWakeLock } from "@/shared/hooks/use-wake-lock";
import { motion, AnimatePresence } from "motion/react";

export function DownloadManager() {
  const activeDownloads = useDownloadStore(state => state.activeDownloads);
  const { request, release, isActive } = useWakeLock();
  const [isInactive, setIsInactive] = useState(false);

  // Wake lock logic
  useEffect(() => {
    if (activeDownloads.length > 0) {
      if (!isActive) request();
    } else {
      if (isActive) release();
      setIsInactive(false);
    }
  }, [activeDownloads.length, isActive, request, release]);

  // OLED Dimmer Logic
  useEffect(() => {
    if (activeDownloads.length === 0) return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      setIsInactive(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsInactive(true);
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Listen to user interactions to reset timer
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Initial timer start
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [activeDownloads.length]);

  return (
    <AnimatePresence>
      {isInactive && activeDownloads.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="pointer-events-none fixed inset-0 z-[9999] bg-black"
        >
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-white/30 text-sm">
              Layar diredupkan untuk menghemat daya selama proses unduhan.<br/>
              Sentuh layar untuk membangunkan.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
