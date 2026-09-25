"use client";

import * as React from "react";
import { UserCircle, SignOut, MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Logo from "@/logo/icon.png";
import { IconButton } from "@/components/ui/icon-button";
import { useAuth } from "@/shared/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import { UpdatesBell } from "./updates-bell";
import { cn } from "@/shared/utils/cn";
import { useSettingsStore } from "@/shared/store/settings-store";

const ROUTE_LABELS: Record<string, string> = {
  "": "Beranda",
  library: "Library",
  bookmark: "Bookmark",
  search: "Cari",
  popular: "Populer",
  sources: "Sumber",
  updates: "Pembaruan",
  downloads: "Unduhan",
  settings: "Pengaturan",
  account: "Akun & Sinkronisasi",
  manga: "Manga",
};

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loginWithGoogle, logout } = useAuth();

  const segments = (pathname || "").split("/").filter(Boolean);
  const primarySegment = segments[0] || "";
  const pageLabel = ROUTE_LABELS[primarySegment] || primarySegment;
  
  // No scroll-morph — always full-width nav (H7)

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <>
      {/* Spacer to reserve layout space for the fixed nav */}
      <div className="hidden md:block h-[68px] w-full shrink-0" />
      
      <header className="hidden md:flex fixed top-0 left-0 md:left-[76px] xl:left-[240px] right-0 z-40 h-[68px] bg-surface-base/85 backdrop-blur-md border-b border-border-subtle items-center px-6 lg:px-8 justify-between transition-[left] duration-300">
        {/* LEFT: Global Editorial Breadcrumb (Phase 3) */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2">
          <ol className="flex items-center gap-2 text-xs">
            <li className="flex items-center gap-2">
              <Link
                href="/"
                className="font-bold uppercase tracking-[0.14em] text-accent hover:opacity-80 transition-opacity"
              >
                Yomirra
              </Link>
              <span className="text-border-default/80 font-medium" aria-hidden="true">/</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold text-text-secondary capitalize" aria-current="page">
                {pageLabel}
              </span>
            </li>
          </ol>
        </nav>

        {/* RIGHT: Search + Bell + Theme + Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 h-full">
          {/* Global Search Trigger */}
          {pathname !== '/library' && pathname !== '/search' && (
            <div className="flex items-center">
              {/* Desktop pill */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
                className={cn(
                  "hidden sm:flex items-center gap-2.5 px-3 rounded-sm transition-colors text-text-secondary hover:text-text-primary text-xs font-semibold h-9 w-48 lg:w-56",
                  "bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
                )}
              >
                <MagnifyingGlass size={16} weight="regular" className="text-text-muted shrink-0" />
                <span className="flex-1 text-left opacity-70">Cari komik…</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-muted rounded-xs border border-border-subtle">⌘K</kbd>
              </button>
              
              {/* Mobile icon only */}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
                className="sm:hidden flex items-center justify-center size-9 rounded-sm bg-surface-raised border border-border-subtle hover:bg-surface-hover text-text-secondary outline-none"
                aria-label="Cari"
              >
                <MagnifyingGlass size={18} weight="duotone" />
              </button>
            </div>
          )}
          
          {/* Notification Bell */}
          <UpdatesBell />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile / Login */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="Profil Pengguna"
                aria-expanded={isProfileOpen}
                className="flex items-center justify-center size-9 rounded-sm bg-surface-raised hover:scale-105 active:scale-95 transition-all outline-none border border-border-subtle hover:border-accent/40 overflow-hidden"
              >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="object-cover w-full h-full rounded-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <UserCircle size={24} weight="duotone" className="text-accent" />
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 w-56 bg-surface-overlay/95 backdrop-blur-xl shadow-glass border border-border-subtle rounded-lg p-1.5 z-[100] flex flex-col"
                    >
                      <div className="px-3 py-2.5 border-b border-border-subtle/70 mb-1.5">
                        <p className="text-[14px] font-bold text-text-primary truncate">{user.displayName || "User"}</p>
                        <p className="text-[12px] text-text-muted truncate mt-0.5">{user.email || ""}</p>
                      </div>
                      <Link 
                        href="/account" 
                        onClick={() => setIsProfileOpen(false)} 
                        className="flex items-center gap-3 px-3 py-2 rounded-sm text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
                      >
                        <UserCircle size={18} weight="duotone" /> Akun & Sinkronisasi
                      </Link>
                      <button onClick={() => { setIsProfileOpen(false); logout(); }} className="flex items-center gap-3 px-3 py-2 rounded-sm text-[13px] font-semibold text-semantic-error hover:bg-semantic-error/10 transition-colors text-left mt-0.5">
                        <SignOut size={18} weight="duotone" /> Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={loginWithGoogle} aria-label="Masuk" className="flex items-center justify-center bg-surface-raised border border-border-subtle shadow-xs hover:bg-surface-hover active:scale-95 transition-all rounded-sm px-4 h-9 gap-2 outline-none">
                <UserCircle size={20} weight="duotone" className="text-text-secondary" />
                <span className="text-sm font-semibold text-text-primary">Masuk</span>
              </button>
            )}
          </div>
      </header>
    </>
  );
}
