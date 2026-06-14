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
          "fixed top-0 right-0 bottom-0 z-[70] w-[320px] bg-surface-base/80 backdrop-blur-xl border-l border-white/5 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          "translate-x-full",
          isOpen && "max-md:translate-x-0",
          isDesktopPanelOpen && "md:translate-x-0"
        )}
      >
        <div className="flex h-[calc(var(--mobile-header-height)+var(--safe-top))] items-center justify-between px-6 shrink-0 pt-[var(--safe-top)] border-b border-white/5">
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

        <div className="flex-1 flex flex-col min-h-0">
          {/* Settings Area (Scrollable on small height) */}
          <div className="flex-1 p-6 space-y-8 overflow-y-auto overscroll-contain custom-scrollbar">
            
            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <ImageSquare size={16} className="text-text-muted" />
                  Warna Latar
                </h3>
                <p className="text-2xs text-text-muted mt-1">Pilih warna yang paling nyaman untuk matamu.</p>
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

            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <BoundingBox size={16} className="text-text-muted" />
                  Jarak Antar Halaman
                </h3>
                <p className="text-2xs text-text-muted mt-1">Mengatur celah kosong di antara gambar komik.</p>
              </div>
              <div className="flex bg-surface-raised/50 p-1 rounded-xl">
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
                        ? "bg-accent text-accent-fg shadow-sm" 
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <ArrowsOutLineVertical size={16} className="text-text-muted" />
                  Ukuran Komik
                </h3>
                <p className="text-2xs text-text-muted mt-1">Atur lebar gambar agar tidak terlalu besar di layar.</p>
              </div>
              <div className="flex bg-surface-raised/50 p-1 rounded-xl">
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
                        ? "bg-accent text-accent-fg shadow-sm" 
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Layout size={16} className="text-text-muted" />
                  Menu Navigasi
                </h3>
                <p className="text-2xs text-text-muted mt-1">Kapan menu atas dan bawah harus muncul.</p>
              </div>
              <div className="flex bg-surface-raised/50 p-1 rounded-xl">
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
                        ? "bg-surface-overlay text-text-primary shadow-sm" 
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Lightning size={16} className="text-text-muted" />
                  Kecepatan Muat
                </h3>
                <p className="text-2xs text-text-muted mt-1">Seberapa banyak chapter yang dimuat di latar belakang.</p>
              </div>
              <div className="flex bg-surface-raised/50 p-1 rounded-xl">
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
                        ? "bg-surface-overlay text-text-primary shadow-sm" 
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Layout size={16} className="text-text-muted" />
                  Fitur Tambahan
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/50 cursor-pointer transition-colors hover:bg-surface-raised">
                  <span className="text-sm font-medium text-text-primary">Progress Halaman</span>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.showPageProgress} 
                    onChange={(e) => updatePreferences({ showPageProgress: e.target.checked })} 
                  />
                  <div className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    preferences.showPageProgress ? "bg-accent" : "bg-border-default"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      preferences.showPageProgress ? "left-5" : "left-1"
                    )} />
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/50 cursor-pointer transition-colors hover:bg-surface-raised">
                  <span className="text-sm font-medium text-text-primary">Layar Selalu Menyala</span>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.keepScreenAwake ?? true} 
                    onChange={(e) => updatePreferences({ keepScreenAwake: e.target.checked })} 
                  />
                  <div className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    (preferences.keepScreenAwake ?? true) ? "bg-accent" : "bg-border-default"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      (preferences.keepScreenAwake ?? true) ? "left-5" : "left-1"
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
