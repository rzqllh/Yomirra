"use client";

import * as React from "react";
import { UserCircle, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconButton } from "@/components/ui/icon-button";
import { useAuth } from "@/shared/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import { SearchInput } from "@/components/ui/search-input";

export function TopNav() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const { user, loginWithGoogle, logout } = useAuth();

  const handleSearch = (e: React.FormEvent, searchValue: string) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <div className="hidden md:flex h-16 w-full items-center justify-between bg-background/50 backdrop-blur-3xl saturate-200 border-b border-border-subtle/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)] px-6 sticky top-0 z-40 transition-all duration-300">
      <div className="flex-1 max-w-xl mx-auto">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSubmitAction={handleSearch}
          placeholder="Cari manga, manhwa..."
          shortcut="⌘K"
          className="bg-surface-base/50 focus-within:bg-surface-base/80 focus-within:ring-accent/30 transition-all"
        />
      </div>
      
      <div className="flex items-center gap-3 pl-4">
        <ThemeToggle />
        
        {user ? (
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-base/40 backdrop-blur-md ring-1 ring-border-subtle/50 shadow-sm transition-all hover:bg-surface-raised/50">
            <div className="flex items-center gap-2 pl-1 pr-2">
              {user.photoURL ? (
                <div className="relative size-7 rounded-full overflow-hidden ring-1 ring-white/10 shadow-inner">
                  <Image src={user.photoURL} alt={user.displayName || "User"} fill sizes="28px" className="object-cover" />
                </div>
              ) : (
                <UserCircle size={28} weight="duotone" className="text-accent" />
              )}
              <span className="text-xs font-semibold text-text-primary hidden lg:block pr-1">
                {user.displayName?.split(' ')[0] || "User"}
              </span>
            </div>
            <div className="h-4 w-px bg-border-subtle/50 hidden lg:block" />
            <IconButton 
              onClick={logout} 
              aria-label="Keluar" 
              variant="ghost" 
              className="size-8 rounded-full hover:bg-error/15 hover:text-error transition-colors"
            >
              <SignOut size={16} weight="bold" />
            </IconButton>
          </div>
        ) : (
          <IconButton 
            onClick={loginWithGoogle} 
            aria-label="Masuk dengan Google" 
            variant="ghost" 
            className="hover:bg-accent/10 hover:text-accent transition-all duration-300 ring-1 ring-border-subtle bg-surface-base/50 backdrop-blur-md shadow-sm rounded-full px-5 w-auto h-9 gap-2 hover:ring-accent/30"
          >
            <UserCircle size={20} weight="duotone" />
            <span className="text-sm font-semibold">Masuk</span>
          </IconButton>
        )}
      </div>
    </div>
  );
}