"use client";

import { useEffect, useState, type RefObject } from "react";

/** Tracks a search anchor even when the Home hero arrives after its loading UI. */
export function useSearchAnchorPastHeader(
  anchorId: string | undefined,
  fallbackBoundary: number,
  headerRef?: RefObject<HTMLElement | null>,
) {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    setIsPast(false);
    if (!anchorId || typeof IntersectionObserver === "undefined") return;

    const header = headerRef?.current;
    let anchor: HTMLElement | null = null;
    let observer: IntersectionObserver | null = null;
    let boundary: number | undefined;

    const updateBoundary = () => {
      const bottom = header?.getBoundingClientRect().bottom;
      const next = bottom && bottom > 0 ? bottom : fallbackBoundary;
      if (next === boundary) return;
      boundary = next;
      observer?.disconnect();

      const currentObserver = new IntersectionObserver((entries) => {
        if (observer !== currentObserver) return;
        for (let index = entries.length - 1; index >= 0; index--) {
          const entry = entries[index];
          if (entry.target === anchor) {
            setIsPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? next));
            return;
          }
        }
      }, { rootMargin: `-${next}px 0px 0px 0px` });
      observer = currentObserver;
      if (anchor) currentObserver.observe(anchor);
    };

    const bindAnchor = () => {
      const next = document.getElementById(anchorId);
      if (next === anchor) return;
      if (anchor) observer?.unobserve(anchor);
      anchor = next;
      setIsPast(false);
      if (anchor) observer?.observe(anchor);
    };

    const mutations = new MutationObserver((records) => {
      bindAnchor();
      if (records.some((record) => record.target === document.documentElement)) {
        updateBoundary();
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const onTopTransition = (event: TransitionEvent) => {
      if (event.target === header && event.propertyName === "top") updateBoundary();
    };
    // The announcement changes the fixed header's position without resizing it.
    const resize = header && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateBoundary)
      : null;
    if (header) {
      mutations.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
      resize?.observe(header, { box: "border-box" });
      header.addEventListener("transitionend", onTopTransition);
      header.addEventListener("transitioncancel", onTopTransition);
    }

    updateBoundary();
    bindAnchor();

    return () => {
      mutations.disconnect();
      resize?.disconnect();
      header?.removeEventListener("transitionend", onTopTransition);
      header?.removeEventListener("transitioncancel", onTopTransition);
      observer?.disconnect();
      observer = null;
    };
  }, [anchorId, fallbackBoundary, headerRef]);

  return isPast;
}
