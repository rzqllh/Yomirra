"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  House,
  Compass,
  Books,
  Fire,
  MagnifyingGlass,
  Icon,
} from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

export interface DockVariantItem {
  id: string
  label: string
  icon: Icon
  badge?: string
}

export const DOCK_LAB_ITEMS: DockVariantItem[] = [
  { id: "beranda", label: "Beranda", icon: House },
  { id: "jelajah", label: "Jelajah", icon: Compass },
  { id: "library", label: "Library", icon: Books, badge: "3" },
  { id: "populer", label: "Populer", icon: Fire },
  { id: "cari", label: "Cari", icon: MagnifyingGlass },
]

export interface DockVariantProps {
  activeTab: string
  onSelectTab: (id: string) => void
  safeAreaBottom?: number
  showTargetOverlay?: boolean
  isReducedMotion?: boolean
}

// ---------------------------------------------------------------------------
// VARIANT 1: Baseline Yomirra (4-Tab Segmented + Detached Satellite Search)
// ---------------------------------------------------------------------------
export function Variant1Baseline({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  const mainItems = DOCK_LAB_ITEMS.filter((i) => i.id !== "cari")
  const searchItem = DOCK_LAB_ITEMS.find((i) => i.id === "cari")!
  const isSearchActive = activeTab === "cari"

  return (
    <div
      className="flex items-center justify-center gap-2 select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Baseline Yomirra"
    >
      <div className="relative flex h-14 min-w-0 items-center justify-center gap-1 rounded-xl border border-border-subtle bg-card/90 px-1.5 py-1 backdrop-blur-md shadow-lg">
        {mainItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex h-11 min-w-[44px] items-center justify-center rounded-lg outline-none transition-all duration-200 select-none",
                isActive ? "px-3" : "w-11",
                "focus-visible:ring-2 focus-visible:ring-accent",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId={isReducedMotion ? undefined : "v1-active-pill"}
                  className="absolute inset-0 rounded-lg bg-accent-dim pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <item.icon
                  size={isActive ? 18 : 20}
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                {isActive && (
                  <span className="text-[12px] font-semibold text-text-primary whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Detached Search Button */}
      <button
        type="button"
        onClick={() => onSelectTab("cari")}
        className={cn(
          "relative flex size-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border-subtle shadow-lg transition-transform active:scale-95",
          isSearchActive
            ? "bg-accent text-accent-contrast ring-2 ring-accent"
            : "bg-card/90 text-text-muted hover:text-text-primary backdrop-blur-md",
          showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
        )}
        aria-label="Cari Komik"
        aria-pressed={isSearchActive}
      >
        <searchItem.icon size={22} weight={isSearchActive ? "bold" : "regular"} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 2: Unified Island Capsule (5 Items in One Symmetric Shell)
// ---------------------------------------------------------------------------
export function Variant2UnifiedPill({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Unified Capsule"
    >
      <div className="relative flex h-14 items-center justify-center gap-1 rounded-2xl border border-border-subtle bg-card/95 px-2 py-1 shadow-xl backdrop-blur-lg">
        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          const isSearch = item.id === "cari"

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl outline-none transition-all duration-200",
                isActive ? "px-3.5" : "w-11",
                isSearch && !isActive && "text-accent hover:bg-accent/10",
                "focus-visible:ring-2 focus-visible:ring-accent",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId={isReducedMotion ? undefined : "v2-active-capsule"}
                  className="absolute inset-0 rounded-xl bg-accent text-accent-contrast shadow-md pointer-events-none"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <item.icon
                  size={20}
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent-contrast" : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                {isActive && (
                  <span className="text-[12px] font-bold text-accent-contrast whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 3: Dynamic Island Yomirra (Fluid Morphing + Semantic Tokens)
// ---------------------------------------------------------------------------
export function Variant3DynamicIsland({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  const mainNavItems = DOCK_LAB_ITEMS.filter((i) => i.id !== "cari")
  const searchItem = DOCK_LAB_ITEMS.find((i) => i.id === "cari")!
  const isSearchActive = activeTab === "cari"

  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Navigasi Dynamic Island Yomirra"
    >
      <motion.div
        layout
        transition={
          isReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 30 }
        }
        className={cn(
          "yomirra-chrome relative flex h-14 items-center justify-center gap-1 rounded-2xl px-2 py-1.5",
          "shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)] dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.65)]",
          "text-text-primary transition-colors duration-200"
        )}
      >
        {/* Main 4 Navigation Tabs */}
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl outline-none select-none tap-highlight-transparent active:scale-95 motion-reduce:transition-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isActive ? "px-3.5 shrink-0" : "size-11 shrink-0 text-text-muted hover:text-text-primary hover:bg-surface-hover/50",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId={isReducedMotion ? undefined : "v3-active-dynamic-tab"}
                  className="absolute inset-0 rounded-xl bg-accent-dim border border-accent/20 pointer-events-none"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <item.icon
                  size={isActive ? 18 : 20}
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors duration-200 shrink-0",
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                {isActive && (
                  <motion.span
                    initial={isReducedMotion ? false : { opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="whitespace-nowrap text-[11.5px] font-semibold leading-none tracking-tight text-text-primary"
                  >
                    {item.label}
                  </motion.span>
                )}
                {!isActive && item.badge && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-contrast ring-2 ring-background">
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          )
        })}

        {/* Subtle Glass Divider separating main navigation from prominent search */}
        <div
          className="h-5 w-[1px] bg-border-glass mx-0.5 shrink-0 self-center opacity-80"
          aria-hidden="true"
        />

        {/* Dedicated Prominent Search Action */}
        <button
          key={searchItem.id}
          type="button"
          onClick={() => onSelectTab(searchItem.id)}
          className={cn(
            "group relative flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl outline-none select-none tap-highlight-transparent active:scale-95 motion-reduce:transition-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            isSearchActive
              ? "px-3.5 shrink-0"
              : "size-11 shrink-0 bg-accent/10 border border-accent/25 text-accent hover:bg-accent/20 hover:border-accent/40 shadow-xs",
            showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
          )}
          aria-label={searchItem.label}
          aria-pressed={isSearchActive}
        >
          {isSearchActive && (
            <motion.span
              layoutId={isReducedMotion ? undefined : "v3-active-dynamic-tab"}
              className="absolute inset-0 rounded-xl bg-accent text-accent-contrast shadow-sm pointer-events-none"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}

          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <searchItem.icon
              size={isSearchActive ? 18 : 20}
              weight={isSearchActive ? "bold" : "bold"}
              className={cn(
                "transition-colors duration-200 shrink-0",
                isSearchActive ? "text-accent-contrast" : "text-accent"
              )}
            />
            {isSearchActive && (
              <motion.span
                initial={isReducedMotion ? false : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="whitespace-nowrap text-[11.5px] font-bold leading-none tracking-tight text-accent-contrast"
              >
                Cari Komik
              </motion.span>
            )}
          </span>
        </button>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 4: iOS Glassmorphic Frosted Glass (Specular Edge Highlight)
// ---------------------------------------------------------------------------
export function Variant4IOSGlass({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock iOS Glassmorphic"
    >
      <div className="relative flex h-14 items-center justify-center gap-1.5 rounded-2xl border border-white/20 dark:border-white/10 bg-card/65 px-2.5 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        {/* Specular Top Edge Light */}
        <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl outline-none transition-all duration-200 active:scale-92",
                isActive
                  ? "bg-white/20 dark:bg-white/10 text-accent font-semibold shadow-inner"
                  : "text-text-muted hover:text-text-primary",
                "focus-visible:ring-2 focus-visible:ring-accent",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              style={{ width: isActive ? "72px" : "48px" }}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <div className="flex flex-col items-center justify-center gap-0.5">
                <item.icon size={20} weight={isActive ? "fill" : "regular"} />
                <span className="text-[10px] leading-none tracking-tight font-medium">
                  {item.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 5: Material 3 Expressive (Floating Oval Indicator)
// ---------------------------------------------------------------------------
export function Variant5MaterialExpressive({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Material 3 Expressive"
    >
      <div className="relative flex h-16 items-center justify-around rounded-3xl border border-border-subtle bg-card/95 px-3 py-1.5 shadow-xl backdrop-blur-md min-w-[320px] max-w-[380px] w-full">
        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[48px] outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent rounded-xl",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <div
                className={cn(
                  "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
                  isActive ? "bg-accent/20 text-accent font-bold" : "text-text-muted group-hover:text-text-primary"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId={isReducedMotion ? undefined : "v5-active-indicator"}
                    className="absolute inset-0 rounded-full bg-accent/20 pointer-events-none"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <item.icon size={20} weight={isActive ? "fill" : "regular"} className="relative z-10" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none tracking-tight transition-colors",
                  isActive ? "text-accent font-semibold" : "text-text-muted"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 6: Minimalist Micro-Dock (Slim Line & Glow Dot)
// ---------------------------------------------------------------------------
export function Variant6MinimalistMicro({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Minimalist Micro"
    >
      <div className="relative flex h-12 items-center justify-center gap-3 rounded-full border border-border-subtle bg-background/90 px-4 shadow-md backdrop-blur-md">
        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent rounded-full",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <item.icon
                size={21}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "transition-all duration-200",
                  isActive ? "text-accent scale-110" : "text-text-muted group-hover:text-text-primary"
                )}
              />
              <div className="h-1 flex items-center justify-center mt-0.5">
                {isActive && (
                  <motion.div
                    layoutId={isReducedMotion ? undefined : "v6-glow-dot"}
                    className="size-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 7: Segmented Tabular Pro (Solid Tactile Slider)
// ---------------------------------------------------------------------------
export function Variant7SegmentedPro({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Segmented Pro"
    >
      <div className="relative flex h-13 items-center justify-center gap-0.5 rounded-xl border border-border bg-card/95 p-1 shadow-lg">
        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex h-11 min-h-[44px] min-w-[48px] items-center justify-center px-2.5 rounded-lg outline-none transition-all duration-150",
                "focus-visible:ring-2 focus-visible:ring-accent",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId={isReducedMotion ? undefined : "v7-active-segment"}
                  className="absolute inset-0 rounded-lg bg-surface-elevated border border-border shadow-sm pointer-events-none"
                  transition={{ type: "spring", stiffness: 480, damping: 34 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-1.5">
                <item.icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-tight transition-colors",
                    isActive ? "text-text-primary" : "text-text-muted"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 8: Dual-Tone Contrast Shell (Amber / Crimson Active Punch)
// ---------------------------------------------------------------------------
export function Variant8DualTone({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Dual-Tone Shell"
    >
      <div className="relative flex h-14 items-center justify-center gap-1.5 rounded-2xl border-2 border-border-strong bg-background/95 px-2.5 py-1.5 shadow-2xl backdrop-blur-md">
        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl outline-none transition-all duration-200",
                isActive
                  ? "bg-amber-500 text-black font-bold shadow-md px-3.5"
                  : "w-11 text-text-muted hover:text-text-primary hover:bg-card/50",
                "focus-visible:ring-2 focus-visible:ring-amber-500",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <div className="flex items-center gap-1.5">
                <item.icon size={20} weight={isActive ? "fill" : "bold"} />
                {isActive && (
                  <span className="text-[12px] font-black uppercase tracking-wider">
                    {item.label}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 9: Native Edge-to-Edge Bottom Bar (Safari / App-Native Full Bleed)
// ---------------------------------------------------------------------------
export function Variant9EdgeToEdge({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="w-full border-t border-border-subtle bg-card/90 backdrop-blur-xl select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Native Edge-to-Edge"
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {DOCK_LAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] flex-1 py-1 outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent rounded-lg",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <item.icon
                size={22}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "transition-colors",
                  isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-tight transition-colors",
                  isActive ? "text-accent" : "text-text-muted"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VARIANT 10: Asymmetric One-Hand Thumb Curve (Ergonomic Right-Hand Sweep)
// ---------------------------------------------------------------------------
export function Variant10AsymmetricThumb({
  activeTab,
  onSelectTab,
  safeAreaBottom = 16,
  showTargetOverlay,
  isReducedMotion,
}: DockVariantProps) {
  return (
    <div
      className="flex items-center justify-end pr-4 select-none"
      style={{ paddingBottom: `${safeAreaBottom}px` }}
      role="navigation"
      aria-label="Dock Asymmetric Thumb Curve"
    >
      <div className="relative flex h-15 items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-card/95 pl-4 pr-2 shadow-2xl backdrop-blur-xl">
        {DOCK_LAB_ITEMS.map((item, idx) => {
          const isActive = activeTab === item.id
          const isPrimaryAction = item.id === "cari"

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex items-center justify-center rounded-full outline-none transition-all duration-200",
                isPrimaryAction
                  ? "size-12 bg-accent text-accent-contrast shadow-md font-bold"
                  : isActive
                  ? "h-10 px-3 bg-accent/20 text-accent font-semibold"
                  : "size-10 text-text-muted hover:text-text-primary",
                "min-h-[44px] min-w-[44px]",
                "focus-visible:ring-2 focus-visible:ring-accent",
                showTargetOverlay && "ring-1 ring-emerald-500/80 bg-emerald-500/10"
              )}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <div className="flex items-center gap-1.5">
                <item.icon size={isPrimaryAction ? 22 : 19} weight={isActive ? "fill" : "regular"} />
                {isActive && !isPrimaryAction && (
                  <span className="text-[11px] whitespace-nowrap">{item.label}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
