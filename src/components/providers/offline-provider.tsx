"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WifiSlash, HardDrives } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface OfflineContextType {
  isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({ isOffline: false });

export const useOffline = () => useContext(OfflineContext);

const OFFLINE_ALLOWED_PATHS = ["/downloads", "/settings"];

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Initial check on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Note: covers SPA navigation only. Hard navigate while offline may show partial render or browser offline page.
  const isReaderPath = pathname.includes("/read/");
  const isAllowedOffline = OFFLINE_ALLOWED_PATHS.includes(pathname) || isReaderPath;
  const showFallback = isOffline && !isAllowedOffline;

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {showFallback ? (
        <div className="fixed inset-0 z-[100] bg-surface-base flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-surface-muted rounded-full flex items-center justify-center text-text-muted mb-6">
            <WifiSlash size={40} weight="duotone" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Anda Sedang Offline</h1>
          <p className="text-text-muted mb-8 max-w-sm">
            Koneksi internet Anda terputus. Anda masih bisa membaca manga yang sudah diunduh.
          </p>
          <Button 
            onClick={() => router.push("/downloads")}
            size="lg"
            className="rounded-full gap-2 font-bold px-8"
          >
            <HardDrives size={20} weight="fill" />
            Buka Manajer Unduhan
          </Button>
        </div>
      ) : (
        children
      )}
    </OfflineContext.Provider>
  );
}
