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
  const checkOnAppStart = useSettingsStore((state) => state.checkOnAppStart);
  const minimumCheckIntervalMinutes = useSettingsStore((state) => state.minimumCheckIntervalMinutes);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stable ref so the mount-only effect doesn't re-fire when caller's options object is recreated
  const checkOnMountRef = useRef(options.checkOnMount);

  const triggerScan = useCallback(async (scanOptions: ScanOptions = {}): Promise<ScanResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsScanning(true);
    try {
      // Convert minutes to ms safely, fallback to 15 mins if invalid
      const safeInterval = typeof minimumCheckIntervalMinutes === "number" && minimumCheckIntervalMinutes > 0
        ? minimumCheckIntervalMinutes * 60 * 1000
        : 15 * 60 * 1000;

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
  // options object removed from deps — only stable scalars here to prevent infinite loop
  // when callers pass an inline object like { checkOnMount: true } on every render
  }, [minimumCheckIntervalMinutes]);

  // Run once on mount — reads from ref to avoid triggering on every re-render
  useEffect(() => {
    if (checkOnMountRef.current && checkOnAppStart) {
      triggerScan({ forceRefresh: false });
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — must only fire once on mount

  return {
    isScanning,
    unreadCount,
    lastScanResult,
    triggerScan,
  };
}
