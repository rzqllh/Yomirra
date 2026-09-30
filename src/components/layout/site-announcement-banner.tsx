"use client";

import * as React from "react";
import { Info, Warning, WarningOctagon, X, ArrowSquareOut } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import type { SiteConfig, AnnouncementType } from "@/shared/types/site-config";

import { usePathname } from "next/navigation";

const DISMISSED_KEY = "yomirra-dismissed-announcement";

export function SiteAnnouncementBanner() {
  const pathname = usePathname();
  const [config, setConfig] = React.useState<SiteConfig | null>(null);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchConfig() {
      try {
        const res = await fetch("/api/site/config");
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled) {
          setConfig(data);
          const dismissedId = sessionStorage.getItem(DISMISSED_KEY);
          if (dismissedId && dismissedId === data.announcement?.id) {
            setIsDismissed(true);
          }
        }
      } catch {
        // Silent catch for offline or unconfigured
      }
    }

    fetchConfig();
    return () => {
      isCancelled = true;
    };
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const announcement = config?.announcement;
  if (!announcement || !announcement.enabled || !announcement.message || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement.id) {
      sessionStorage.setItem(DISMISSED_KEY, announcement.id);
    }
  };

  const typeConfig: Record<
    AnnouncementType,
    { bg: string; border: string; text: string; icon: React.ReactNode }
  > = {
    info: {
      bg: "bg-accent/10",
      border: "border-accent/20",
      text: "text-accent",
      icon: <Info size={16} weight="fill" className="shrink-0 text-accent" />,
    },
    warning: {
      bg: "bg-semantic-warning/10",
      border: "border-semantic-warning/25",
      text: "text-semantic-warning",
      icon: <Warning size={16} weight="fill" className="shrink-0 text-semantic-warning" />,
    },
    alert: {
      bg: "bg-semantic-danger/10",
      border: "border-semantic-danger/25",
      text: "text-semantic-danger",
      icon: <WarningOctagon size={16} weight="fill" className="shrink-0 text-semantic-danger" />,
    },
  };

  const style = typeConfig[announcement.type] || typeConfig.info;

  return (
    <aside
      aria-label="Pengumuman Situs"
      className={cn(
        "relative z-40 w-full border-b backdrop-blur-md px-3.5 py-2 text-xs transition-all animate-in fade-in duration-200",
        style.bg,
        style.border
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {style.icon}
          <div className="flex flex-wrap items-center gap-2 text-text-primary font-medium truncate">
            <span>{announcement.message}</span>
            {announcement.link && (
              <a
                href={announcement.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80",
                  style.text
                )}
              >
                <span>Pelajari lebih lanjut</span>
                <ArrowSquareOut size={12} weight="bold" />
              </a>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup pengumuman"
          className="size-6 shrink-0 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-raised/40 transition-colors focus:outline-none"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </aside>
  );
}
