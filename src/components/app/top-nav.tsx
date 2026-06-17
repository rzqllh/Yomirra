"use client";

import * as React from "react";
import { UserCircle, SignOut, Gear, MagnifyingGlass, Books } from "@phosphor-icons/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll } from "motion/react";
import Logo from "@/logo/icon.png";
import { IconButton } from "@/components/ui/icon-button";
import { useAuth } from "@/shared/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/shared/utils/cn";

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loginWithGoogle, logout } = useAuth();
  
  // Scroll morph detection
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { scrollY } = useScroll();
  
  React.useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 30);
    });
  }, [scrollY]);

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

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/library", label: "Library" },
    { href: "/sources", label: "Sumber" },
    { href: "/bookmark", label: "Bookmark" },
  ];

  return (
    <>
      {/* Spacer to reserve layout space for the fixed nav */}
      <div className="hidden md:block h-[72px] w-full shrink-0" />
      
      <div 
        className={cn(
          "hidden md:flex fixed top-0 left-0 right-0 z-40 w-full transition-all duration-500 pointer-events-none h-[72px]",
          isScrolled 
            ? "items-center px-4 md:px-8" 
            : "px-0 bg-surface-glass backdrop-blur-3xl border-b border-border-glass"
        )}
      >
      <motion.div 
        layout
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "flex items-center justify-between pointer-events-auto transition-colors duration-500 overflow-visible mx-auto",
          isScrolled 
            ? "max-w-7xl w-full h-[60px] bg-surface-glass backdrop-blur-xl border border-border-glass shadow-sm rounded-full px-6" 
            : "w-full h-[72px] px-8"
        )}
      >
        {/* LEFT: Logo & Brand */}
        <Link href="/" className="flex items-center gap-2 outline-none shrink-0 h-full group z-10">
          <div className="relative size-8 sm:size-9 flex items-center justify-center drop-shadow-sm group-hover:drop-shadow-md group-hover:scale-105 active:scale-95 transition-all">
            <Image src={Logo} alt="Yomirra Logo" className="w-full h-full object-contain" priority />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary hidden sm:block">
            Yomirra
          </span>
        </Link>

        {/* CENTER: Navigation Links (Absolute Centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-8 h-full">
          {navLinks.map((item) => {
  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
  return (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "relative flex items-center h-full text-sm transition-colors outline-none",
        isActive ? "text-text-primary font-semibold" : "text-text-secondary hover:text-text-primary"
      )}
    >
      {item.label}
      {isActive && (
        <motion.div
          layoutId="nav-underline"
          className="absolute bottom-4 left-0 right-0 h-[2px] rounded-full bg-accent "
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
})}
        </div>

        {/* RIGHT: Search + Theme + Profile */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 h-full z-10">
          {/* Global Search Trigger */}
          {pathname !== '/library' && (
            <div className="flex items-center">
              {/* Desktop pill */}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-3 rounded-full transition-all text-text-muted hover:text-text-primary text-sm h-9 w-48",
                  "bg-surface-glass backdrop-blur-md border border-border-glass shadow-sm hover:bg-surface-hover/50"
                )}
              >
                <MagnifyingGlass size={16} weight="duotone" />
                <span className="flex-1 text-left opacity-70">Cari...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-default/40 bg-surface-base px-1.5 font-mono text-[10px] font-medium text-text-muted opacity-70">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
              
              {/* Mobile icon only */}
              <IconButton 
                onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
                className="sm:hidden size-9 rounded-full bg-surface-glass backdrop-blur-md border border-border-glass shadow-sm hover:bg-surface-hover/50 text-text-secondary"
                aria-label="Cari"
              >
                <MagnifyingGlass size={18} weight="duotone" />
              </IconButton>
            </div>
          )}
          
          <motion.div layout transition={{ duration: 0.3, ease: "easeOut" }}>
            <ThemeToggle />
          </motion.div>
          

            {user ? (
              <motion.div layout transition={{ duration: 0.3, ease: "easeOut" }} className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-label="Profil Pengguna"
                  className={cn(
                    "flex items-center justify-center rounded-full bg-surface-glass backdrop-blur-md border border-border-glass shadow-sm hover:scale-105 active:scale-95 transition-all outline-none",
                    isScrolled ? "size-9" : "size-9 lg:size-10"
                  )}
                >
                  {user.photoURL ? (
                    <div className="size-full rounded-full overflow-hidden border border-border-default">
                      <img src={user.photoURL} alt="User" className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <UserCircle size={28} weight="duotone" className="text-accent" />
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-14 w-56 bg-surface-overlay/95 backdrop-blur-xl border border-border-default shadow-heavy rounded-2xl p-1.5 z-50 flex flex-col"
                    >
                      <div className="px-3 py-2.5 border-b border-border-glass mb-1.5">
                        <p className="text-[14px] font-bold text-text-primary truncate">{user.displayName || "User"}</p>
                        <p className="text-[12px] text-text-muted truncate mt-0.5">{user.email || ""}</p>
                      </div>
                      <button onClick={() => { setIsProfileOpen(false); router.push('/settings'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left">
                        <Gear size={18} weight="duotone" /> Pengaturan
                      </button>
                      <button onClick={() => { setIsProfileOpen(false); logout(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-semantic-error hover:bg-semantic-error/10 transition-colors text-left mt-0.5">
                        <SignOut size={18} weight="duotone" /> Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div layout transition={{ duration: 0.3, ease: "easeOut" }}>
                <button onClick={loginWithGoogle} aria-label="Masuk" className="flex items-center justify-center bg-surface-raised ring-1 ring-border-subtle shadow-sm hover:bg-surface-hover active:scale-95 transition-all rounded-full px-4 h-9 gap-2 outline-none">
                  <UserCircle size={20} weight="duotone" className="text-text-secondary" />
                  <span className="text-sm font-semibold text-text-primary">Masuk</span>
                </button>
              </motion.div>
            )}
          </div>
      </motion.div>
      </div>
    </>
  );
}