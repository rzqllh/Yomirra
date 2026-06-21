"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/shared/utils/cn";

export function HorizontalScrollContainer({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [didDrag, setDidDrag] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDidDrag(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll speed multiplier
    
    if (Math.abs(walk) > 5) {
      setDidDrag(true);
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didDrag) {
      e.stopPropagation();
      e.preventDefault();
      setDidDrag(false);
    }
  }, [didDrag]);

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onClickCapture={handleClickCapture}
      className={cn(
        "flex overflow-x-auto w-full min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth pb-4 -mb-4 px-1 -mx-1",
        className
      )}
      {...props}
    >
      <div className="flex w-max gap-4 sm:gap-6 pr-4 sm:pr-8">
        {children}
      </div>
    </div>
  );
}
