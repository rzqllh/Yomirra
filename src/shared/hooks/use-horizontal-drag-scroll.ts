"use client";

import * as React from "react";

/**
 * Enables smooth mouse drag-to-scroll and vertical-to-horizontal wheel conversion
 * on horizontal shelf containers without interfering with native touch scrolling or clicks.
 */
export function useHorizontalDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = React.useRef<T>(null);
  const isDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasMovedRef = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent<T>) => {
    // Only primary button (left click)
    if (e.button !== 0 || !containerRef.current) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    containerRef.current.style.cursor = "grabbing";
    containerRef.current.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent<T>) => {
    if (!isDownRef.current || !containerRef.current) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
      e.preventDefault();
      containerRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!containerRef.current) return;
    isDownRef.current = false;
    containerRef.current.style.cursor = "grab";
    containerRef.current.style.removeProperty("user-select");
  };

  // Prevent link navigation if the user was actively dragging
  const handleClickCapture = (e: React.MouseEvent<T>) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasMovedRef.current = false;
    }
  };

  // Convert vertical mouse wheel to horizontal scrolling if cursor is over shelf
  const handleWheel = (e: React.WheelEvent<T>) => {
    const el = containerRef.current;
    if (!el) return;
    // If predominantly vertical wheel
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 4) {
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
      if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
        el.scrollLeft += e.deltaY;
      }
    }
  };

  return {
    ref: containerRef,
    dragProps: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
      onClickCapture: handleClickCapture,
      onWheel: handleWheel,
      style: { cursor: "grab" },
    },
  };
}
