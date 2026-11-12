"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Gear,
  Stack,
  Palette,
  Question,
  SignOut,
  SignIn,
  CaretRight,
} from "@phosphor-icons/react"
import { motion, AnimatePresence } from "motion/react"
import { useMounted } from "@/shared/hooks/use-mounted"
import { UpdatesBell } from "@/components/overlays/updates-bell"
import { useAuth } from "@/shared/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import { cn } from "@/shared/utils/cn"

export function HeaderActions({ className }: { className?: string } = {}) {
  const pathname = usePathname()
  const isSettingsActive = pathname === "/settings"
  const mounted = useMounted()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { user, loginWithGoogle, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on click outside or Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
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
      <UpdatesBell className="size-11 rounded-xl border-transparent bg-transparent text-text-primary shadow-none hover:border-transparent hover:bg-surface-hover/60" />

      {/* Settings / Profile Trigger Button (Squircle rounded-xl) */}
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Buka menu akun"
        aria-expanded={isMenuOpen}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-xl border border-transparent bg-transparent shadow-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 select-none active:scale-95 cursor-pointer",
          isSettingsActive
            ? "border-accent/30 bg-accent/15 text-accent"
            : isMenuOpen
              ? "bg-surface-hover/80 text-text-primary"
              : "text-text-primary hover:bg-surface-hover/60"
        )}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="size-full rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Gear
            size={20}
            weight={isSettingsActive ? "fill" : isMenuOpen ? "bold" : "regular"}
            className={cn("shrink-0 transition-transform duration-200", isSettingsActive && "text-accent")}
          />
        )}
      </button>

      {/* Dropdown Menu Popover (Mockup Gambar 1 & 2) */}
      <AnimatePresence>
        {isMenuOpen && (
          <Surface asChild variant="glassPopover" rounded="card" elevation="popover" className="shadow-xl">
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-12 z-overlay w-60 rounded-xl border border-border-subtle p-1.5 flex flex-col gap-0.5 select-none"
            >
            {/* Beak Pointer Notch */}
            <div className="absolute -top-1.5 right-3.5 size-3 rotate-45 bg-surface-overlay border-l border-t border-border-subtle pointer-events-none" />

            {/* User Profile Header (if logged in) */}
            {user && (
              <div className="px-3 py-2 border-b border-border-subtle/70 mb-1">
                <p className="text-sm font-bold text-text-primary truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  {user.email || ""}
                </p>
              </div>
            )}

            {/* 1. Pengaturan aplikasi */}
            <Link
              href="/settings"
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "group flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-md text-sm active:scale-98 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isSettingsActive
                  ? "font-bold text-accent bg-accent-dim border border-accent/40"
                  : "font-medium text-text-primary hover:bg-surface-hover"
              )}
            >
              <Gear
                size={18}
                weight={isSettingsActive ? "fill" : "regular"}
                className={cn("shrink-0", isSettingsActive ? "text-accent" : "text-text-muted")}
              />
              <span>Pengaturan</span>
            </Link>

            <Link
              href="/sources"
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-11 items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
              className="flex min-h-11 items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-2.5">
                <Palette size={18} className="text-text-muted shrink-0" />
                <span>Tema tampilan</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                <span>{currentThemeLabel}</span>
                <CaretRight size={13} className="text-text-muted/70" />
              </div>
            </button>

            {/* 3. Pusat bantuan */}
            <Link
              href="/help"
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-11 items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-primary hover:bg-surface-hover active:scale-98 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-2.5">
                <Question size={18} className="text-text-muted shrink-0" />
                <span>Pusat bantuan</span>
              </div>
              <CaretRight size={13} className="text-text-muted/70" />
            </Link>

            {/* Divider */}
            <div className="my-1 border-t border-border-subtle/80" />

            {/* 4. Keluar akun / Masuk akun */}
            {user ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsMenuOpen(false)
                  logout()
                }}
                className="flex min-h-11 items-center justify-start gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-semantic-error hover:bg-semantic-error/10 active:scale-98 transition-all w-full text-left cursor-pointer h-auto focus-visible:ring-2 focus-visible:ring-semantic-error"
              >
                <SignOut size={18} weight="regular" className="shrink-0" />
                <span>Keluar</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsMenuOpen(false)
                  loginWithGoogle()
                }}
                className="flex min-h-11 items-center justify-start gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-accent bg-transparent hover:bg-accent-dim active:scale-98 transition-all w-full text-left cursor-pointer h-auto focus-visible:ring-2 focus-visible:ring-accent"
              >
                <SignIn size={18} weight="regular" className="shrink-0" />
                <span>Masuk</span>
              </Button>
            )}
          </motion.div>
        </Surface>
        )}
      </AnimatePresence>
    </div>
  )
}
