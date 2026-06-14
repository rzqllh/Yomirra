"use client"

import * as React from "react"
import { X, SlidersHorizontal, ImageSquare, Layout, Lightning, BoundingBox, ArrowsOutLineVertical } from "@phosphor-icons/react"
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
  const { preferences, updatePreferences, isDesktopPanelOpen, toggleDesktopPanel } = useReaderStore()

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
          "fixed top-0 right-0 bottom-0 z-[70] w-80 bg-surface-overlay/95 backdrop-blur-3xl border-l border-border-glass shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          "translate-x-full",
          isOpen && "max-md:translate-x-0",
          isDesktopPanelOpen && "md:translate-x-0"
        )}
      >
        <div className="flex h-[calc(var(--mobile-header-height)+var(--safe-top))] items-center justify-between px-6 shrink-0 pt-[var(--safe-top)]">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-accent" weight="bold" />
            Pengaturan Pembaca
          </h2>
          <IconButton
            aria-label="Tutup panel"
            variant="ghost"
            size="sm"
            className="rounded-full bg-surface-raised/50 hover:bg-surface-raised"
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

        <div className="flex-1 overflow-y-auto p-6 space-y-8 flex flex-col custom-scrollbar pb-[calc(24px+var(--safe-bottom))]">
          
          <div className="space-y-4 shrink-0">
            <h3 className="text-2xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <ImageSquare size={16} />
              Warna Latar
            </h3>
            <div className="flex gap-3">
              {[
                { name: 'Hitam', value: 'black', color: '#000000', border: 'border-white/10' },
                { name: 'Deep Lagoon', value: 'deepLagoon', color: '#003135', border: 'border-white/10' },
                { name: 'Mist', value: 'mist', color: '#f8fafc', border: 'border-black/10' }
              ].map(bg => (
                <button
                  key={bg.value}
                  onClick={() => updatePreferences({ background: bg.value as any })}
                  aria-label={`Latar ${bg.name}`}
                  className={cn(
                    "relative size-12 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                    bg.border,
                    preferences.background === bg.value ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-base" : ""
                  )}
                  style={{ backgroundColor: bg.color }}
                  title={bg.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 shrink-0">
            <h3 className="text-2xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <BoundingBox size={16} />
              Jarak Antar Halaman
            </h3>
            <div className="flex bg-surface-raised/50 p-1 rounded-xl">
              {[
                { id: 'none', label: 'Rapat' },
                { id: 'small', label: 'Kecil' },
                { id: 'comfortable', label: 'Nyaman' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updatePreferences({ pageGap: mode.id as any })}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
                    preferences.pageGap === mode.id 
                      ? "bg-accent text-accent-fg shadow-sm" 
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 shrink-0">
            <h3 className="text-2xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <ArrowsOutLineVertical size={16} />
              Ukuran Gambar
            </h3>
            <div className="flex bg-surface-raised/50 p-1 rounded-xl">
              {[
                { id: 'width', label: 'Penuh (Lebar)' },
                { id: 'contained', label: 'Proporsional' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updatePreferences({ imageFit: mode.id as any })}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
                    preferences.imageFit === mode.id 
                      ? "bg-accent text-accent-fg shadow-sm" 
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4 shrink-0">
            <h3 className="text-2xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Layout size={16} />
              Perilaku Toolbar
            </h3>
            <div className="flex bg-surface-raised/50 p-1 rounded-xl">
              {[
                { id: 'auto-hide', label: 'Auto Sembunyi' },
                { id: 'always-visible', label: 'Selalu Tampil' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updatePreferences({ toolbarBehavior: mode.id as any })}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
                    preferences.toolbarBehavior === mode.id 
                      ? "bg-surface-overlay text-text-primary shadow-sm" 
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 shrink-0">
            <h3 className="text-2xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Lightning size={16} />
              Performa Preload
            </h3>
            <div className="flex bg-surface-raised/50 p-1 rounded-xl">
              {[
                { id: 'light', label: 'Ringan' },
                { id: 'balanced', label: 'Normal' },
                { id: 'aggressive', label: 'Agresif' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updatePreferences({ preloadIntensity: mode.id as any })}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
                    preferences.preloadIntensity === mode.id 
                      ? "bg-surface-overlay text-text-primary shadow-sm" 
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter List for Desktop Panel */}
          {chapters && sourceId && mangaId && (
            <div className="flex-1 flex flex-col space-y-4 min-h-0 pt-4 border-t border-border-glass">
              <h3 className="text-2xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 shrink-0">
                <Layout size={16} />
                Daftar Chapter
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                {chapters.map((chapter) => {
                  const isCurrent = chapter.id === currentChapterId;
                  return (
                    <Link
                      key={chapter.id}
                      href={getReaderHref(sourceId, mangaId, chapter.id)}
                      className={cn(
                        "w-full flex flex-col items-start px-4 py-3 transition-colors outline-none",
                        isCurrent 
                          ? "bg-accent/10 border-l-2 border-accent" 
                          : "hover:bg-surface-raised/50 border-l-2 border-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold line-clamp-1 text-left leading-tight",
                        isCurrent ? "text-accent" : "text-text-primary"
                      )}>
                        {chapter.title}
                      </span>
                      <span className={cn(
                        "text-2xs mt-1 font-medium",
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
