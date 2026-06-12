"use client"

import * as React from "react"
import { X, SlidersHorizontal, ImageSquare, Layout } from "@phosphor-icons/react"
import { useReaderStore } from "@/shared/store/reader-store"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"

import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { Chapter } from "@/shared/types/source"

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: Chapter[];
  currentChapterId?: string;
  sourceId?: string;
  mangaId?: string;
}

export function ReaderSettingsDrawer({ isOpen, onClose, chapters, currentChapterId, sourceId, mangaId }: ReaderSettingsDrawerProps) {
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
        <div className="flex h-[calc(var(--mobile-header-height)+var(--safe-top))] items-center justify-between px-6 border-b border-border-subtle shrink-0 pt-[var(--safe-top)]">
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

        <div className="flex-1 overflow-y-auto p-6 space-y-8 flex flex-col">
          
          <div className="space-y-4 shrink-0">
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
          
          <div className="space-y-4 shrink-0">
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

          {/* Chapter List for Desktop Panel */}
          {chapters && sourceId && mangaId && (
            <div className="flex-1 flex flex-col space-y-4 min-h-0 pt-4 border-t border-border-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2 shrink-0">
                <Layout size={16} />
                Daftar Chapter
              </h3>
              <div className="flex-1 overflow-y-auto space-y-1 pr-2 -mr-2 custom-scrollbar">
                {chapters.map((chapter) => {
                  const isCurrent = chapter.id === currentChapterId;
                  return (
                    <Link
                      key={chapter.id}
                      href={getReaderHref(sourceId, mangaId, chapter.id)}
                      className={cn(
                        "w-full flex flex-col items-start px-3 py-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        isCurrent 
                          ? "bg-accent/10 border border-accent/20" 
                          : "hover:bg-surface-raised active:bg-surface-overlay border border-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold line-clamp-1 text-left",
                        isCurrent ? "text-accent" : "text-text-primary"
                      )}>
                        {chapter.title}
                      </span>
                      <span className={cn(
                        "text-[10px] mt-0.5 font-medium",
                        isCurrent ? "text-accent/80" : "text-text-muted"
                      )}>
                        {chapter.date}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
