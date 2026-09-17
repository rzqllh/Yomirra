"use client";

import * as React from "react";
import Link from "next/link";
import { Play } from "@phosphor-icons/react";
import { useHistoryStore } from "@/shared/store/history-store";
import { getReaderHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export function FloatingResumeDock() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    
    const handleScroll = () => {
      // Show dock when scrolled past 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const _historyItemsState = useHistoryStore(state => state.items); // Subscribe to changes
  const historyItems = isMounted ? getContinueReading(1) : [];
  const item = historyItems[0];

  if (!isMounted || !item || pathname !== "/") return null;

  return (
    <motion.div 
      drag
      dragConstraints={{ left: -16, right: 16, top: -400, bottom: 16 }}
      dragElastic={0.2}
      dragMomentum={false}
      whileTap={{ cursor: "grabbing" }}
      className={cn(
        "fixed bottom-8 right-8 z-[100] transition-all duration-500 hidden md:block cursor-grab",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <Link 
        href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}
        draggable={false}
        className="flex relative bg-surface-glass backdrop-blur-xl border border-border-subtle rounded-2xl p-2 items-center gap-4 group hover:bg-surface-overlay/80 transition-all hover:scale-105 pointer-events-auto shadow-glass"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border-subtle shrink-0">
          <img src={item.coverUrl || ""} className="w-full h-full object-cover pointer-events-none" alt={item.mangaTitle} draggable={false} />
        </div>
        <div className="flex flex-col min-w-[120px] pointer-events-none">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Lanjut Baca</span>
          <span className="text-xs font-semibold text-text-primary line-clamp-1 w-[120px]">{item.mangaTitle}</span>
        </div>
        <button className="size-8 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 mr-1 shadow-[0_4px_16px_rgba(108,106,250,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/20 pointer-events-none">
          <Play weight="fill" size={14} />
        </button>
      </Link>
    </motion.div>
  );
}
