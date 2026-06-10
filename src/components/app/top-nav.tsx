"use client";

import * as React from "react";
import { UserCircle, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconButton } from "@/components/ui/icon-button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";

export function TopNav() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const { user, loginWithGoogle, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="hidden md:flex h-16 w-full items-center justify-between bg-background/80 backdrop-blur-xl border-b border-border-subtle px-6 sticky top-0 z-40 transition-all">
      <div className="flex-1 max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex items-center gap-3 rounded-full bg-surface-raised px-4 py-2 transition-all duration-[var(--motion-fast)] hover:bg-surface-overlay focus-within:bg-surface-overlay focus-within:ring-1 focus-within:ring-accent border border-border-subtle shadow-sm">
          <MagnifyingGlass className="size-4 text-text-muted shrink-0" weight="bold" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari manga, manhwa..." 
            className="flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted font-medium"
          />
          <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border-strong bg-surface-base px-1.5 font-mono text-[10px] font-bold text-text-muted">
            ⌘K
          </kbd>
        </form>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-surface-raised border border-border-subtle pl-1 pr-3 py-1">
              {user.photoURL ? (
                <Image src={user.photoURL} alt={user.displayName || "User"} width={24} height={24} className="rounded-full" />
              ) : (
                <UserCircle size={24} weight="duotone" className="text-accent" />
              )}
              <span className="text-[12px] font-medium text-text-primary hidden lg:block">
                {user.displayName?.split(' ')[0] || "User"}
              </span>
            </div>
            <IconButton onClick={logout} aria-label="Keluar" variant="ghost" className="hover:bg-error/10 hover:text-error transition-colors">
              <SignOut size={20} />
            </IconButton>
          </div>
        ) : (
          <IconButton onClick={loginWithGoogle} aria-label="Masuk dengan Google" variant="ghost" className="hover:bg-accent/10 hover:text-accent transition-colors border border-border-subtle bg-surface-raised rounded-full px-4 w-auto h-9 gap-2">
            <UserCircle size={20} weight="duotone" />
            <span className="text-[13px] font-medium">Masuk</span>
          </IconButton>
        )}
      </div>
    </div>
  );
}
