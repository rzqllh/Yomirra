"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "motion/react";

export function HomeSearchPill() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus after morph animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <>
      {/* Backdrop (Only on mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm pointer-events-auto"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Pill Container (Only on mobile) */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "md:hidden fixed z-[101]",
          isOpen 
            ? "top-4 left-4 right-4 h-14" 
            : "top-[calc(var(--safe-top)+16px)] right-4 h-10 w-10 md:w-64"
        )}
      >
        <form 
          onSubmit={handleSubmit}
          className={cn(
            "w-full h-full flex items-center bg-surface-glass/40 backdrop-blur-xl border border-border-glass overflow-hidden transition-shadow duration-300",
            isOpen 
              ? "rounded-2xl px-4 shadow-2xl ring-1 ring-accent/30" 
              : "rounded-full md:px-4 justify-center md:justify-start cursor-pointer hover:bg-surface-hover shadow-md"
          )}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
        >
          <MagnifyingGlass 
            className={cn(
              "shrink-0 transition-colors duration-300",
              isOpen ? "size-6 text-accent" : "size-5 md:size-[18px] text-text-muted"
            )} 
            weight="bold" 
          />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari komik favoritmu..."
            className={cn(
              "bg-transparent text-[16px] font-medium text-text-primary outline-none placeholder:text-text-muted/60 h-full transition-all duration-300",
              isOpen ? "opacity-100 w-full ml-3 flex-1" : "flex-none opacity-0 w-0 md:opacity-100 md:w-full md:ml-3 md:flex-1 pointer-events-none md:pointer-events-auto"
            )}
            tabIndex={isOpen ? 0 : -1}
          />

          <AnimatePresence>
            {isOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1 rounded-full hover:bg-surface-hover text-text-muted transition-colors ml-2 shrink-0 bg-surface-raised/50"
              >
                <X size={20} weight="bold" />
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </>
  );

  if (!mounted) return null;
  return ReactDOM.createPortal(content, document.body);
}
