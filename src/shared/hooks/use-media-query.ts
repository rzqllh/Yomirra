"use client";

import * as React from "react";

/** Subscribes to a CSS media query after mount so SSR and initial hydration agree. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof window.matchMedia === "function") {
      const mediaQueryList = window.matchMedia(query);
      const sync = () => setMatches(mediaQueryList.matches);
      sync();
      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", sync);
        return () => mediaQueryList.removeEventListener("change", sync);
      }
      mediaQueryList.addListener?.(sync);
      return () => mediaQueryList.removeListener?.(sync);
    }

    const minWidthMatch = /\(\s*min-width\s*:\s*(\d+)px\s*\)/.exec(query);
    if (!minWidthMatch) return;
    const minWidth = Number(minWidthMatch[1]);
    const syncWidth = () => setMatches(window.innerWidth >= minWidth);
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, [query]);

  return matches;
}
