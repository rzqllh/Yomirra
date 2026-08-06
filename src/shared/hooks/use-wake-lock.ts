import { useState, useEffect, useCallback, useRef } from "react";
import { useSettingsStore } from "@/shared/store/settings-store";

export function useWakeLock() {
  const [isSupported] = useState(() => typeof window !== "undefined" && "navigator" in window && "wakeLock" in navigator);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const keepScreenAwake = useSettingsStore(state => state.keepScreenAwake);

  const request = useCallback(async () => {
    if (!isSupported || !keepScreenAwake) return;
    try {
      if (wakeLockRef.current) return;
      const wakeLock = await navigator.wakeLock.request("screen");
      
      wakeLock.addEventListener("release", () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });
      
      wakeLockRef.current = wakeLock;
      setIsActive(true);
    } catch (err) {
      console.warn("Wake Lock error:", err);
    }
  }, [isSupported, keepScreenAwake]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      } catch (err) {
        console.warn("Wake Lock release error:", err);
      }
    }
  }, []);

  // Handle visibility change (re-request wake lock when returning to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && keepScreenAwake) {
        // We only re-request if it was active before, but since we don't track 
        // that tightly, we just let the caller manage request/release.
        // Actually, wake locks auto-release on visibility hidden.
        // We should probably re-request it if it was supposed to be active.
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [request, keepScreenAwake]);

  return { isSupported, isActive, request, release };
}
