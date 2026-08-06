import { useState, useCallback, useEffect, useRef } from "react";
import { scanLibraryUpdates, type ScanResult, type ScanOptions } from "@/shared/lib/update-checker";
import { useUpdateStore } from "@/shared/store/update-store";

export interface UseUpdateCheckerOptions extends ScanOptions {
  checkOnMount?: boolean;
}

export function useUpdateChecker(options: UseUpdateCheckerOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const unreadCount = useUpdateStore((state) => state.getUnreadCount());
  const abortControllerRef = useRef<AbortController | null>(null);

  const triggerScan = useCallback(async (scanOptions: ScanOptions = {}): Promise<ScanResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsScanning(true);
    try {
      const mergedOptions = { ...options, ...scanOptions, signal: controller.signal };
      const res = await scanLibraryUpdates(mergedOptions);
      setLastScanResult(res);
      return res;
    } finally {
      setIsScanning(false);
    }
  }, [options]);

  useEffect(() => {
    if (options.checkOnMount) {
      triggerScan({ forceRefresh: false });
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [options.checkOnMount, triggerScan]);

  return {
    isScanning,
    unreadCount,
    lastScanResult,
    triggerScan,
  };
}
