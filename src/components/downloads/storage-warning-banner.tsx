"use client";

import { useEffect, useState } from "react";
import { Warning, X } from "@phosphor-icons/react";
import { YomirraSurface } from "@/components/ui/layout";

export function StorageWarningBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Basic detection for iOS/iPadOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      // Check if user dismissed it previously
      const dismissed = localStorage.getItem("yomirra_storage_warning_dismissed");
      if (!dismissed) {
        setTimeout(() => setIsVisible(true), 0);
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <YomirraSurface variant="elevated" className="rounded-2xl p-4 flex gap-3 relative overflow-hidden bg-semantic-warning/10 border-semantic-warning/20">
      <div className="absolute top-0 left-0 w-1 h-full bg-semantic-warning"></div>
      <div className="text-semantic-warning shrink-0 mt-0.5">
        <Warning size={20} weight="fill" />
      </div>
      <div className="flex-1 pr-6">
        <h4 className="text-sm font-bold text-text-primary mb-1">Batas Penyimpanan iOS</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Safari membatasi penyimpanan offline sekitar 50MB. Kosongkan unduhan yang sudah selesai jika unduhan baru mulai gagal atau terhenti.
        </p>
      </div>
      <button 
        onClick={() => {
          setIsVisible(false);
          localStorage.setItem("yomirra_storage_warning_dismissed", "true");
        }}
        className="absolute top-2 right-2 text-text-muted hover:text-text-primary p-2"
        aria-label="Tutup"
      >
        <X size={16} />
      </button>
    </YomirraSurface>
  );
}
