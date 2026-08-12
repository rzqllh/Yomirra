"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { motion, AnimatePresence } from "motion/react"
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
  // Handle Escape key to close panel
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const containerClasses =
    desktopMode === "side-panel"
      ? "fixed inset-x-0 bottom-0 z-[70] max-h-[85vh] md:max-h-screen md:inset-y-0 md:left-auto md:right-0 md:w-80 md:bottom-auto bg-surface-base border-t md:border-t-0 md:border-l border-border-subtle flex flex-col rounded-t-[24px] md:rounded-none overflow-hidden shadow-xl"
      : "fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] min-h-[50vh] bg-surface-base border-t border-border-subtle rounded-t-3xl flex flex-col md:max-w-md md:mx-auto md:mb-6 md:bottom-6 md:rounded-3xl shadow-xl overflow-hidden"

  const backdropClasses =
    desktopMode === "side-panel"
      ? "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
      : "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={backdropClasses}
            onClick={onClose}
          />

          {/* Panel Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(containerClasses, className)}
          >
            {/* Header */}
            <div className="flex flex-col gap-4 px-5 py-4 shrink-0 bg-surface-raised z-10 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  {icon && <span className="text-accent">{icon}</span>}
                  {title}
                </h2>
                <IconButton
                  aria-label="Tutup panel"
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-surface-glass border border-border-subtle hover:bg-surface-hover text-text-primary transition-colors"
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
