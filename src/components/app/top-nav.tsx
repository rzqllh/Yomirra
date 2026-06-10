"use client";

import * as React from "react";
import { UserCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";

export function TopNav() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="hidden md:flex h-16 w-full items-center justify-between bg-surface-base border-b border-border-subtle px-6 sticky top-0 z-40">
      <div className="flex-1 max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex items-center gap-3 rounded-full bg-surface-raised px-4 py-2 transition-all duration-[var(--motion-fast)] focus-within:bg-surface-overlay focus-within:ring-2 focus-within:ring-accent/50 border border-border-subtle">
          <MagnifyingGlass className="size-4 text-text-muted shrink-0" weight="bold" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul..." 
            className="flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border-strong bg-surface-overlay px-1.5 font-mono text-[10px] font-medium text-text-muted">
            ⌘K
          </kbd>
        </form>
      </div>
      
      <div className="flex items-center gap-2">
        <IconButton aria-label="Profil pengguna" variant="ghost">
          <UserCircle size={24} weight="light" />
        </IconButton>
      </div>
    </div>
  );
}
