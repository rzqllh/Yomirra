"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Gear,
  Stack,
  Palette,
  Globe,
  Question,
  SignOut,
  SignIn,
  CaretRight,
  UserCircle,
} from "@phosphor-icons/react"
import { motion, AnimatePresence } from "motion/react"
import { useMounted } from "@/shared/hooks/use-mounted"
import { UpdatesBell } from "@/components/app/updates-bell"
import { useAuth } from "@/shared/hooks/use-auth"
import { cn } from "@/shared/utils/cn"

export function HeaderActions({ className }: { className?: string } = {}) {
  const mounted = useMounted()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { user, loginWithGoogle, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isMenuOpen])

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
  }

  const currentThemeLabel = !mounted
    ? "..."
    : theme === "system"
      ? "Sistem"
      : resolvedTheme === "dark"
        ? "Gelap"
        : "Terang"

  return (
    <div className={cn("relative flex items-center gap-2 shrink-0", className)} ref={menuRef}>
      <UpdatesBell className="size-10 rounded-2xl border-transparent bg-transparent text-text-primary shadow-none hover:border-transparent hover:bg-surface-hover/60" />

      {/* Settings / Profile Trigger Button (Squircle rounded-2xl) */}
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Buka menu akun"
        aria-expanded={isMenuOpen}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-2xl border border-transparent bg-transparent shadow-none transition-colors outline-none select-none active:scale-95 cursor-pointer",
          isMenuOpen
            ? "border-accent/30 bg-accent/15 text-accent"
            : "text-text-primary hover:bg-surface-hover/60"
        )}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="size-full rounded-2xl object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Gear
            size={20}
            weight={isMenuOpen ? "fill" : "regular"}
            className="shrink-0 transition-transform duration-200"
          />
        )}
      </button>

      {/* Dropdown Menu Popover (Mockup Gambar 1 & 2) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-12 z-[100] w-[230px] rounded-2xl bg-surface-overlay/95 backdrop-blur-2xl border border-border-subtle shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18),0_4px_16px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.7),0_4px_16px_-2px_rgba(0,0,0,0.4)] p-1.5 flex flex-col gap-0.5 select-none"
          >
            {/* Beak Pointer Notch */}
            <div className="absolute -top-1.5 right-3.5 size-3 rotate-45 bg-surface-overlay border-l border-t border-border-subtle pointer-events-none" />

            {/* User Profile Header (if logged in) */}
            {user && (
              <div className="px-3 py-2 border-b border-border-subtle/70 mb-1">
                <p className="text-[13.5px] font-bold text-text-primary truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-[11.5px] text-text-muted truncate mt-0.5">
                  {user.email || ""}
                </p>
              </div>
            )}

            {/* 1. Pengaturan aplikasi */}
            <Link
              href="/settings"
              onClick={() => setIsMenuOpen(false)}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold text-accent bg-accent/10 hover:bg-accent/15 active:scale-98 transition-all"
            >
              <Gear size={18} weight="fill" className="text-accent shrink-0" />
              <span>Pengaturan</span>
            </Link>

            <Link
              href="/sources"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Stack size={18} className="text-text-muted shrink-0" />
                <span>Sumber</span>
              </div>
              <CaretRight size={13} className="text-text-muted/70" />
            </Link>

            {/* 2. Tema tampilan */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-[13px] font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Palette size={18} className="text-text-muted shrink-0" />
                <span>Tema tampilan</span>
              </div>
              <div className="flex items-center gap-1 text-[11.5px] font-semibold text-text-muted">
                <span>{currentThemeLabel}</span>
                <CaretRight size={13} className="text-text-muted/70" />
              </div>
            </button>

            {/* 3. Bahasa */}
            <Link
              href="/settings#general"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Globe size={18} className="text-text-muted shrink-0" />
                <span>Bahasa</span>
              </div>
              <div className="flex items-center gap-1 text-[11.5px] font-semibold text-text-muted">
                <span>Indonesia</span>
                <CaretRight size={13} className="text-text-muted/70" />
              </div>
            </Link>

            {/* 4. Pusat bantuan */}
            <Link
              href="/settings#about"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Question size={18} className="text-text-muted shrink-0" />
                <span>Pusat bantuan</span>
              </div>
              <CaretRight size={13} className="text-text-muted/70" />
            </Link>

            {/* Divider */}
            <div className="my-1 border-t border-border-subtle/80" />

            {/* 5. Keluar akun / Masuk akun */}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  logout()
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-semantic-error hover:bg-semantic-error/10 active:scale-98 transition-all w-full text-left cursor-pointer"
              >
                <SignOut size={18} weight="bold" className="shrink-0" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  loginWithGoogle()
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-accent hover:bg-accent/10 active:scale-98 transition-all w-full text-left cursor-pointer"
              >
                <SignIn size={18} weight="bold" className="shrink-0" />
                <span>Masuk</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
