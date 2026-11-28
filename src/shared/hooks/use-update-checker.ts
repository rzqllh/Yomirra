import { useState, useCallback, useEffect, useRef } from "react";
import { scanLibraryUpdates, type ScanResult, type ScanOptions } from "@/shared/lib/update-checker";
import { useUpdateStore } from "@/shared/store/update-store";
import { useSettingsStore } from "@/shared/store/settings-store";

export interface UseUpdateCheckerOptions extends ScanOptions {
  checkOnMount?: boolean;
}

export function useUpdateChecker(options: UseUpdateCheckerOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const unreadCount = useUpdateStore((state) => state.getUnreadCount());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stable ref so the mount-only effect doesn't re-fire when caller's options object is recreated
  const checkOnMountRef = useRef(options.checkOnMount);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const triggerScan = useCallback(async (scanOptions: ScanOptions = {}): Promise<ScanResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsScanning(true);
    try {
      const { minimumCheckIntervalMinutes } = useSettingsStore.getState();
      // Convert minutes to ms safely, fallback to 360 mins (6 Jam) if invalid (SET-02)
      const safeInterval = typeof minimumCheckIntervalMinutes === "number" && minimumCheckIntervalMinutes >= 60
        ? minimumCheckIntervalMinutes * 60 * 1000
        : 360 * 60 * 1000;

      const mergedOptions = {
        cooldownMs: safeInterval,
        ...scanOptions,
        signal: controller.signal,
      };
      const res = await scanLibraryUpdates(mergedOptions);
      setLastScanResult(res);
      return res;
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Run once on mount — reads from ref to avoid triggering on every re-render
  useEffect(() => {
    // During hydration the render snapshot can still contain the defaults.
    if (checkOnMountRef.current && useSettingsStore.getState().checkOnAppStart) {
      triggerScan({
        forceRefresh: false,
        prioritizeRecent: optionsRef.current.prioritizeRecent ?? true,
        maxItems: optionsRef.current.maxItems ?? 15,
      });
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [triggerScan]);

  return {
    isScanning,
    unreadCount,
    lastScanResult,
    triggerScan,
  };
}
