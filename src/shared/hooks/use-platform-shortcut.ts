"use client";

import * as React from "react";

export interface PlatformShortcutInfo {
  modifier: "⌘" | "Ctrl";
  searchShortcut: "⌘K" | "Ctrl+K";
  searchAriaLabel: string;
}

export function usePlatformShortcut(): PlatformShortcutInfo {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator !== "undefined") {
      const platform =
        (navigator as any).userAgentData?.platform ||
        navigator.platform ||
        navigator.userAgent ||
        "";
      setIsMac(/Mac|iPhone|iPad|iPod/i.test(platform));
    }
  }, []);

  return {
    modifier: isMac ? "⌘" : "Ctrl",
    searchShortcut: isMac ? "⌘K" : "Ctrl+K",
    searchAriaLabel: isMac ? "Cari komik (Tekan ⌘K)" : "Cari komik (Tekan Ctrl+K)",
  };
}
