"use client";

import * as React from "react";
import { UserCircle, SignOut } from "@phosphor-icons/react";
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
    <div className="hidden md:flex h-16 w-full items-center justify-between bg-surface-base/80 backdrop-blur-xl border-b border-border-subtle shadow-sm px-6 sticky top-0 z-40 transition-all duration-150">
      <div className="flex-1 max-w-xl mx-auto">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSubmitAction={handleSearch}
          placeholder="Cari judul"
          shortcut="⌘K"
          className="bg-surface-raised focus-within:bg-surface-overlay transition-all"
        />
      </div>
      
      <div className="flex items-center gap-3 pl-4">
        <ThemeToggle />
        
        {user ? (
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-raised ring-1 ring-border-subtle shadow-sm transition-all hover:bg-surface-hover">
            <div className="flex items-center gap-2 pl-1 pr-2">
              {user.photoURL ? (
                <div className="relative size-7 rounded-full overflow-hidden shadow-inner">
                  <Image src={user.photoURL} alt={user.displayName || "User"} fill sizes="28px" className="object-cover" />
                </div>
              ) : (
                <UserCircle size={28} weight="duotone" className="text-accent" />
              )}
              <span className="text-xs font-semibold text-text-primary hidden lg:block pr-1">
                {user.displayName?.split(' ')[0] || "User"}
              </span>
            </div>
            <div className="h-4 w-px bg-border-subtle hidden lg:block" />
            <IconButton 
              onClick={logout} 
              aria-label="Keluar" 
              variant="ghost" 
              className="size-8 rounded-full hover:bg-semantic-error/15 hover:text-semantic-error transition-colors"
            >
              <SignOut size={16} weight="bold" />
            </IconButton>
          </div>
        ) : (
          <IconButton 
            onClick={loginWithGoogle} 
            aria-label="Masuk dengan Google" 
            variant="ghost" 
            className="hover:bg-surface-hover transition-all duration-150 ring-1 ring-border-subtle bg-surface-raised shadow-sm rounded-full px-5 w-auto h-9 gap-2"
          >
            <UserCircle size={20} weight="duotone" />
            <span className="text-sm font-semibold">Masuk</span>
          </IconButton>
        )}
      </div>
    </div>
  );
}