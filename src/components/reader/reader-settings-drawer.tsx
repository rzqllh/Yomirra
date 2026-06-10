"use client"

import * as React from "react"
import { X, SlidersHorizontal, ImageSquare, Layout } from "@phosphor-icons/react"
import { useReaderStore } from "@/shared/store/reader-store"
import type { ReaderMode } from "@/shared/types/manga"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_LABELS: Record<ReaderMode, string> = {
  CONTINUOUS_VERTICAL: "Vertikal Kontinu",
  PAGED: "Halaman",
  WEBTOON: "Webtoon",
}

export function ReaderSettingsDrawer({ isOpen, onClose }: ReaderSettingsDrawerProps) {
  const { settings, updateSettings, isDesktopPanelOpen, toggleDesktopPanel } = useReaderStore()

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[70] w-[320px] bg-surface-base border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          "translate-x-full",
          isOpen && "max-md:translate-x-0",
          isDesktopPanelOpen && "md:translate-x-0"
        )}
      >
        <div className="flex h-[calc(60px+env(safe-area-inset-top))] items-center justify-between px-6 border-b border-border-subtle shrink-0 pt-[env(safe-area-inset-top)]">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-text-muted" weight="bold" />
            Pengaturan Pembaca
          </h2>
          <IconButton
            aria-label="Tutup panel"
            variant="surface"
            size="sm"
            onClick={() => {
              onClose();
              if (window.innerWidth >= 768 && isDesktopPanelOpen) {
                toggleDesktopPanel();
              }
            }}
          >
            <X size={16} weight="bold" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Layout size={16} />
              Mode Baca
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(['CONTINUOUS_VERTICAL', 'PAGED', 'WEBTOON'] as ReaderMode[]).map(mode => (
                <Button
                  key={mode}
                  variant="secondary"
                  active={settings.mode === mode}
                  onClick={() => updateSettings({ mode })}
                  className="justify-between w-full"
                >
                  {MODE_LABELS[mode]}
                  {settings.mode === mode && <div className="size-2 rounded-full bg-accent" />}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <ImageSquare size={16} />
              Warna Latar
            </h3>
            <div className="flex gap-3">
              {[
                { name: 'Gelap', value: '#0a0a0a', border: 'border-white/10' },
                { name: 'Redup', value: '#1a1b1e', border: 'border-white/10' },
                { name: 'Terang', value: '#ffffff', border: 'border-black/10' }
              ].map(bg => (
                <button
                  key={bg.value}
                  onClick={() => updateSettings({ backgroundColor: bg.value })}
                  aria-label={`Latar ${bg.name}`}
                  className={cn(
                    "relative size-12 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                    bg.border,
                    settings.backgroundColor === bg.value ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-base" : ""
                  )}
                  style={{ backgroundColor: bg.value }}
                  title={bg.name}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Lebar Tampilan
            </h3>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="400" 
                max="1200" 
                step="100"
                value={settings.maxWidth || 800}
                onChange={(e) => updateSettings({ maxWidth: Number(e.target.value) })}
                className="flex-1 accent-accent h-1.5 bg-surface-overlay rounded-lg appearance-none cursor-pointer"
                aria-label="Lebar tampilan halaman"
              />
              <span className="text-sm font-bold text-text-primary w-12 text-right">
                {settings.maxWidth}px
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
