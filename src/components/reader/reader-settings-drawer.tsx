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
          "fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-x-0 bottom-0 max-h-[85vh] md:max-h-screen md:inset-y-0 md:left-auto md:right-0 md:w-80 md:bottom-auto bg-surface dark:bg-[#0a0a0f] shadow-2xl flex flex-col z-[70]",
          "transition-transform duration-150 ease-out rounded-t-3xl md:rounded-none",
          isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
        )}
      >
        <div className="flex h-[calc(var(--mobile-header-height)+var(--safe-top))] items-center justify-between px-6 shrink-0 pt-[var(--safe-top)] border-b border-white/5">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-accent" weight="bold" />
            Pengaturan Pembaca
          </h2>
          <div className="bg-black/10 dark:bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-sm shrink-0">
            <IconButton
              aria-label="Tutup panel"
              variant="ghost"
              size="sm"
              className="rounded-full min-h-[32px] min-w-[32px] hover:bg-black/5 dark:hover:bg-surface-hover transition-colors text-text-primary"
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
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Settings Area (Scrollable on small height) */}
          <div className="flex-1 p-5 space-y-6 overflow-y-auto overscroll-contain custom-scrollbar pb-[calc(24px+var(--safe-bottom))]">
            
            {/* Tampilan */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-primary/90 px-2 uppercase tracking-wider drop-shadow-sm">Tampilan</h3>
              
              <div className="bg-surface-raised/70 dark:bg-surface-raised/50 rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col divide-y divide-white/10">
                {/* Warna Latar */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ImageSquare size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Warna Latar</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { name: 'Gelap', value: 'black', color: '#000000', border: 'border-white/10' },
                      { name: 'Hijau Gelap', value: 'deepLagoon', color: '#003135', border: 'border-white/10' },
                      { name: 'Terang', value: 'mist', color: '#f8fafc', border: 'border-black/10' }
                    ].map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => updatePreferences({ background: bg.value as any })}
                        aria-label={`Latar ${bg.name}`}
                        className={cn(
                          "relative size-12 rounded-full border shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                          bg.border,
                          preferences.background === bg.value ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-base scale-105" : ""
                        )}
                        style={{ backgroundColor: bg.color }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Ukuran Komik */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ArrowsOutLineVertical size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Ukuran Komik</span>
                    </div>
                  </div>
                  <div className="flex bg-surface-base/80 dark:bg-surface-base/60 p-1 rounded-xl border border-white/5 shadow-inner">
                    {[
                      { id: 'width', label: 'Lebar Penuh' },
                      { id: 'contained', label: 'Proporsional' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => updatePreferences({ imageFit: mode.id as any })}
                        className={cn(
                          "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors",
                          preferences.imageFit === mode.id 
                            ? "bg-surface-overlay text-text-primary shadow-md ring-1 ring-border-default/50" 
                            : "text-text-primary/70 hover:text-text-primary hover:bg-surface-raised/50"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jarak Antar Halaman */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BoundingBox size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Jarak Antar Halaman</span>
                    </div>
                  </div>
                  <div className="flex bg-surface-base/80 dark:bg-surface-base/60 p-1 rounded-xl border border-white/5 shadow-inner">
                    {[
                      { id: 'none', label: 'Tanpa Jarak' },
                      { id: 'small', label: 'Sedikit' },
                      { id: 'comfortable', label: 'Jauh' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => updatePreferences({ pageGap: mode.id as any })}
                        className={cn(
                          "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors",
                          preferences.pageGap === mode.id 
                            ? "bg-surface-overlay text-text-primary shadow-md ring-1 ring-border-default/50" 
                            : "text-text-primary/70 hover:text-text-primary hover:bg-surface-raised/50"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Perilaku */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-primary/90 px-2 uppercase tracking-wider drop-shadow-sm">Perilaku</h3>
              
              <div className="bg-surface-raised/70 dark:bg-surface-raised/50 rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col divide-y divide-white/10">
                {/* Arah Baca */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layout size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Arah Baca Paged</span>
                    </div>
                  </div>
                  <div className="flex bg-surface-base/80 dark:bg-surface-base/60 p-1 rounded-xl border border-white/5 shadow-inner">
                    {[
                      { id: 'ltr', label: 'Kiri ke Kanan' },
                      { id: 'rtl', label: 'Kanan ke Kiri' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => updatePreferences({ readingDirection: mode.id as any })}
                        className={cn(
                          "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors",
                          preferences.readingDirection === mode.id 
                            ? "bg-surface-overlay text-text-primary shadow-md ring-1 ring-border-default/50" 
                            : "text-text-primary/70 hover:text-text-primary hover:bg-surface-raised/50"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Navigasi */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layout size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Menu Navigasi</span>
                    </div>
                  </div>
                  <div className="flex bg-surface-base/80 dark:bg-surface-base/60 p-1 rounded-xl border border-white/5 shadow-inner">
                    {[
                      { id: 'auto-hide', label: 'Auto Sembunyi' },
                      { id: 'always-visible', label: 'Selalu Tampil' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => updatePreferences({ toolbarBehavior: mode.id as any })}
                        className={cn(
                          "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors",
                          preferences.toolbarBehavior === mode.id 
                            ? "bg-surface-overlay text-text-primary shadow-md ring-1 ring-border-default/50" 
                            : "text-text-primary/70 hover:text-text-primary hover:bg-surface-raised/50"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kecepatan Muat */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lightning size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Kecepatan Muat</span>
                    </div>
                  </div>
                  <div className="flex bg-surface-base/80 dark:bg-surface-base/60 p-1 rounded-xl border border-white/5 shadow-inner">
                    {[
                      { id: 'light', label: 'Ringan' },
                      { id: 'balanced', label: 'Normal' },
                      { id: 'aggressive', label: 'Maksimal' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => updatePreferences({ preloadIntensity: mode.id as any })}
                        className={cn(
                          "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors",
                          preferences.preloadIntensity === mode.id 
                            ? "bg-surface-overlay text-text-primary shadow-md ring-1 ring-border-default/50" 
                            : "text-text-primary/70 hover:text-text-primary hover:bg-surface-raised/50"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fitur Tambahan */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-primary/90 px-2 uppercase tracking-wider drop-shadow-sm">Fitur Tambahan</h3>
              
              <div className="bg-surface-raised/70 dark:bg-surface-raised/50 rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col divide-y divide-white/10">
                {/* Progress Halaman */}
                <label className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-surface-raised/50">
                  <span className="text-sm font-bold text-text-primary">Progress Halaman</span>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.showPageProgress} 
                    onChange={(e) => updatePreferences({ showPageProgress: e.target.checked })} 
                  />
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors relative shadow-inner",
                    preferences.showPageProgress ? "bg-accent" : "bg-black/20 dark:bg-white/10"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                      preferences.showPageProgress ? "translate-x-6" : "translate-x-1"
                    )} />
                  </div>
                </label>

                {/* Layar Selalu Menyala */}
                <label className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-surface-raised/50">
                  <span className="text-sm font-bold text-text-primary">Layar Selalu Menyala</span>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.keepScreenAwake ?? true} 
                    onChange={(e) => updatePreferences({ keepScreenAwake: e.target.checked })} 
                  />
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors relative shadow-inner",
                    (preferences.keepScreenAwake ?? true) ? "bg-accent" : "bg-black/20 dark:bg-white/10"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                      (preferences.keepScreenAwake ?? true) ? "translate-x-6" : "translate-x-1"
                    )} />
                  </div>
                </label>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}
