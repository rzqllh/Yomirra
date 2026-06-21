"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";

export function MorphingSearch() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 180) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
      setIsExpanded(false); // Reset expansion when scrolling back up
    }
  });

  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
    }
  };

  const isCollapsed = isScrolled && !isExpanded;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-md h-12 z-[100] transition-all duration-300">
        <div className={cn(
          "transition-all duration-300",
          isScrolled ? "fixed top-[calc(var(--safe-top)+16px)] right-4 md:right-8 z-[100]" : "relative w-full"
        )}>
          <div className={cn(
            "flex w-full",
            isScrolled ? "justify-end" : "justify-start"
          )}>
            <motion.form 
              layout
              onSubmit={handleSubmit}
              initial={false}
              animate={{
                width: isCollapsed ? 48 : "100%",
                maxWidth: isCollapsed ? 48 : 448, // 448px = max-w-md
                borderRadius: isCollapsed ? 24 : 24,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "h-12 flex items-center bg-surface-glass backdrop-blur-2xl overflow-hidden cursor-pointer",
                isExpanded && "ring-2 ring-accent/50",
                !isCollapsed && "px-4"
              )}
              onClick={() => {
                if (isCollapsed) setIsExpanded(true);
              }}
            >
              <div className={cn(
                "flex items-center justify-center shrink-0",
                isCollapsed ? "w-12 h-12" : "w-auto"
              )}>
                <MagnifyingGlass 
                  className={cn(
                    "transition-colors duration-300",
                    isExpanded ? "text-accent" : "text-text-muted",
                    isCollapsed ? "size-5" : "size-[18px]"
                  )} 
                  weight="bold" 
                />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari komik favoritmu..."
                className={cn(
                  "bg-transparent text-base font-medium text-text-primary outline-none placeholder:text-text-muted/60 h-full transition-all duration-300",
                  !isCollapsed ? "w-full ml-3 flex-1 opacity-100" : "w-0 opacity-0 pointer-events-none"
                )}
                tabIndex={isCollapsed ? -1 : 0}
              />

              <AnimatePresence>
                {isExpanded && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    className="p-1.5 rounded-full hover:bg-surface-hover text-text-muted transition-colors ml-2 shrink-0 bg-surface-raised/50"
                  >
                    <X size={16} weight="bold" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.form>
          </div>
        </div>
      </div>
    </>
  );
}
