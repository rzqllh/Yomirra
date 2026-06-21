"use client";

import * as React from "react";
import { WifiHigh, WifiSlash } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showIndicator, setShowIndicator] = React.useState(false);

  React.useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Use setTimeout to avoid synchronous state update in effect
    const timer = setTimeout(() => {
      setIsOnline(navigator.onLine);
    }, 0);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the "Back online" message after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check - if loaded offline, show indicator immediately
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-[100] flex justify-center mt-2 pointer-events-none"
        >
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium -md backdrop-blur-md ${ isOnline ? "bg-semantic-success/20 text-semantic-success -semantic-success/30" : "bg-surface-muted/90 text-text-muted --default"}`}
          >
            {isOnline ? (
              <>
                <WifiHigh size={14} weight="bold" />
                <span>Kembali Online</span>
              </>
            ) : (
              <>
                <WifiSlash size={14} weight="bold" />
                <span>Sedang Offline (Mode Lokal)</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
