"use client";

import * as React from "react";
import { UserCircle, SignOut, MagnifyingGlass, Globe, Question } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/shared/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import { UpdatesBell } from "./updates-bell";
import { cn } from "@/shared/utils/cn";
import { useSidebarStore } from "@/shared/store/sidebar-store";

const ROUTE_LABELS: Record<string, string> = {
  "": "Beranda",
  library: "Library",
  bookmark: "Rak Buku",
  search: "Cari",
  popular: "Populer",
  sources: "Sumber",
  updates: "Jadwal",
  downloads: "Unduhan",
  settings: "Pengaturan",
  account: "Akun & Sinkronisasi",
  manga: "Manga",
};

export function TopNav() {
  const pathname = usePathname();
  const { user, loginWithGoogle, logout } = useAuth();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  const segments = (pathname || "").split("/").filter(Boolean);
  const primarySegment = segments[0] || "";
  const pageLabel = ROUTE_LABELS[primarySegment] || primarySegment;
  const isHome = pathname === "/";

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const [scrolledPastHero, setScrolledPastHero] = React.useState(!isHome);

  const shouldShowSearch =
    pathname !== "/library" &&
    pathname !== "/search" &&
    (!isHome || scrolledPastHero);

  React.useEffect(() => {
    if (!isHome) {
      setScrolledPastHero(true);
      return;
    }

    const checkScroll = () => {
      // Reveal search pill in header when user scrolls past hero search area (> 180px)
      setScrolledPastHero(window.scrollY > 180);
    };

    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, [isHome]);

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
      
      <header
        style={{ top: "var(--announcement-height, 0px)" }}
        className={cn(
          "hidden md:flex fixed right-0 z-40 h-[68px] bg-surface-base/85 backdrop-blur-md border-b border-border-subtle items-center px-6 lg:px-8 justify-between transition-[left,top] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          isCollapsed ? "left-[76px]" : "left-[76px] xl:left-[240px]"
        )}
      >
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
          {/* Sticky search pill: visible on non-home pages or when scrolled past hero */}
          {shouldShowSearch && (
            <div className="hidden md:flex h-9 w-48 lg:w-56 shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
                aria-label="Cari komik (Tekan ⌘K)"
                className={cn(
                  "flex items-center gap-2.5 px-3 rounded-sm text-text-secondary hover:text-text-primary text-xs font-semibold h-9 w-full cursor-pointer select-none",
                  "bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent",
                  "transition-all duration-200 ease-out"
                )}
              >
                <MagnifyingGlass size={16} weight="regular" className="text-text-muted shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left opacity-70 truncate">Cari komik…</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-muted rounded-xs border border-border-subtle">
                  ⌘K
                </kbd>
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
                className="flex items-center justify-center size-9 sm:size-10 rounded-2xl bg-surface-raised hover:scale-105 active:scale-95 transition-all outline-none border border-border-subtle hover:border-accent/40 overflow-hidden cursor-pointer"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="object-cover size-full rounded-2xl" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircle size={24} weight="duotone" className="text-accent" />
                )}
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-12 w-60 bg-surface-overlay/95 backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.7)] border border-border-subtle rounded-2xl p-1.5 z-[100] flex flex-col gap-0.5 select-none"
                  >
                    <div className="px-3 py-2 border-b border-border-subtle/70 mb-1">
                      <p className="text-[13.5px] font-bold text-text-primary truncate">{user.displayName || "User"}</p>
                      <p className="text-[11.5px] text-text-muted truncate mt-0.5">{user.email || ""}</p>
                    </div>

                    <Link 
                      href="/account" 
                      onClick={() => setIsProfileOpen(false)} 
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
                    >
                      <UserCircle size={18} weight="duotone" /> Akun & Sinkronisasi
                    </Link>

                    <Link 
                      href="/settings#general" 
                      onClick={() => setIsProfileOpen(false)} 
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe size={18} weight="duotone" /> Bahasa
                      </div>
                      <span className="text-[11.5px] text-text-muted font-medium">Indonesia</span>
                    </Link>

                    <Link 
                      href="/settings#about" 
                      onClick={() => setIsProfileOpen(false)} 
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
                    >
                      <Question size={18} weight="duotone" /> Pusat bantuan
                    </Link>

                    <div className="my-1 border-t border-border-subtle/80" />

                    <button 
                      onClick={() => { setIsProfileOpen(false); logout(); }} 
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-semantic-error hover:bg-semantic-error/10 transition-colors text-left cursor-pointer w-full"
                    >
                      <SignOut size={18} weight="bold" /> Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={loginWithGoogle} aria-label="Masuk" className="flex items-center justify-center bg-surface-raised border border-border-subtle shadow-xs hover:bg-surface-hover active:scale-95 transition-all rounded-2xl px-4 h-9 sm:h-10 gap-2 outline-none cursor-pointer">
              <UserCircle size={20} weight="duotone" className="text-text-secondary" />
              <span className="text-sm font-semibold text-text-primary">Masuk</span>
            </button>
          )}
          </div>
      </header>
    </>
  );
}
