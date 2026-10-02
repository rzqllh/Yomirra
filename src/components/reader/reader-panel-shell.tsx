"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"

export interface ReaderPanelShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: React.ReactNode
  /** Additional controls inside header (e.g. search bar, sort button) */
  headerControls?: React.ReactNode
  /** Desktop layout variant: 'bottom-dialog' (centered floating modal) or 'side-panel' (slide-out right sidebar) */
  desktopMode?: "bottom-dialog" | "side-panel"
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function ReaderPanelShell({
  isOpen,
  onClose,
  title,
  icon,
  headerControls,
  desktopMode = "bottom-dialog",
  children,
  className,
  contentClassName,
}: ReaderPanelShellProps) {
  const reducedMotion = useReducedMotion()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId()

  React.useLayoutEffect(() => {
    if (!isOpen) return

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const panel = panelRef.current
    panel?.focus()

    return () => {
      const previous = previousFocusRef.current
      if (previous?.isConnected) previous.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("aria-hidden"))

      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const containerClasses =
    desktopMode === "side-panel"
      ? "fixed inset-x-0 bottom-0 z-[var(--z-overlay)] max-h-[88dvh] md:max-h-screen md:inset-y-0 md:left-auto md:right-0 md:w-80 md:bottom-auto bg-surface-base border-t md:border-t-0 md:border-l border-border-subtle flex flex-col rounded-t-[28px] md:rounded-none overflow-hidden shadow-heavy"
      : "fixed bottom-0 left-0 right-0 z-[var(--z-overlay)] max-h-[88dvh] min-h-[44dvh] bg-surface-base border-t border-border-subtle rounded-t-[28px] flex flex-col md:max-w-md md:mx-auto md:mb-6 md:bottom-6 md:rounded-3xl shadow-heavy overflow-hidden"

  const backdropClasses =
    desktopMode === "side-panel"
      ? "fixed inset-0 z-[var(--z-drawer)] bg-black/45 backdrop-blur-[2px] md:hidden"
      : "fixed inset-0 z-[var(--z-drawer)] bg-black/45 backdrop-blur-[2px]"

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className={backdropClasses}
            onClick={onClose}
          />

          {/* Panel Container */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reducedMotion ? false : { y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(containerClasses, className)}
          >
            {/* Header */}
            <div className="flex flex-col gap-3 px-5 pt-3 pb-4 shrink-0 bg-surface-base/96 backdrop-blur-xl z-10 border-b border-border-subtle">
              <div className="mx-auto h-1 w-11 rounded-full bg-border-strong/80" />
              <div className="flex items-center justify-between">
                <h2 id={titleId} className="text-base font-bold text-text-primary flex items-center gap-2">
                  {icon && <span className="text-accent">{icon}</span>}
                  {title}
                </h2>
                <IconButton
                  aria-label="Tutup panel"
                  variant="ghost"
                  size="sm"
                  className="yomirra-chrome-control rounded-xl hover:bg-surface-hover text-text-primary transition-colors"
                  onClick={onClose}
                >
                  <X size={16} weight="bold" />
                </IconButton>
              </div>
              {headerControls}
            </div>

            {/* Content Body */}
            <div className={cn("flex-1 overflow-y-auto custom-scrollbar", contentClassName)}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
