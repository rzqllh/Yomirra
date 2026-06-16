"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

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

  return (
    <>
      {/* Overlay Backdrop when open */}
      <div 
        className={cn(
          "fixed inset-0 z-[var(--z-modal)] bg-surface-base/80 backdrop-blur-md transition-all duration-300 ease-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Morphing Container */}
      <div 
        className={cn(
          "fixed z-[calc(var(--z-modal)+1)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          isOpen 
            ? "top-4 left-4 right-4 h-14" 
            : "top-[calc(var(--safe-top)+16px)] right-4 h-10 w-10 md:w-64"
        )}
      >
        <form 
          onSubmit={handleSubmit}
          className={cn(
            "w-full h-full flex items-center bg-surface-glass backdrop-blur-md border border-border-glass transition-all duration-300 overflow-hidden",
            isOpen 
              ? "rounded-2xl px-4 shadow-xl ring-2 ring-accent/20" 
              : "rounded-full md:px-4 justify-center md:justify-start cursor-pointer hover:bg-surface-hover shadow-sm"
          )}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
        >
          <MagnifyingGlass 
            className={cn(
              "text-text-muted shrink-0 transition-colors",
              isOpen ? "size-6 text-accent" : "size-5 md:size-[18px]"
            )} 
            weight="regular" 
          />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari komik favoritmu..."
            className={cn(
              "flex-1 bg-transparent text-[16px] font-medium text-text-primary outline-none placeholder:text-text-muted/60 h-full ml-3 transition-opacity duration-200",
              isOpen ? "opacity-100 w-full" : "opacity-0 w-0 md:opacity-100 md:w-full pointer-events-none md:pointer-events-auto"
            )}
            tabIndex={isOpen ? 0 : -1}
          />

          {isOpen && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 rounded-full hover:bg-surface-hover text-text-muted transition-colors ml-2"
            >
              <X size={20} weight="bold" />
            </button>
          )}
        </form>
      </div>
    </>
  );
}
