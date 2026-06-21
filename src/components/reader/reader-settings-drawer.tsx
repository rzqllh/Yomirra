"use client"

import * as React from "react"
import { X, SlidersHorizontal, ImageSquare, Layout, Lightning, BoundingBox, ArrowsOutLineVertical } from "@phosphor-icons/react"
import { useReaderStore } from "@/shared/store/reader-store"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"
import { ToggleSwitch } from "@/components/ui/toggle-switch"

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKGROUNDS = [
  { name: 'Gelap', value: 'black', color: '#000000', border: 'border-white/10' },
  { name: 'Hijau Gelap', value: 'deepLagoon', color: '#003135', border: 'border-white/10' },
  { name: 'Terang', value: 'mist', color: '#f8fafc', border: 'border-black/10' }
] as const;

const IMAGE_FITS = [
  { id: 'width', label: 'Lebar Penuh' },
  { id: 'contained', label: 'Proporsional' },
] as const;

const PAGE_GAPS = [
  { id: 'none', label: 'Tanpa Jarak' },
  { id: 'small', label: 'Sedikit' },
  { id: 'comfortable', label: 'Jauh' }
] as const;

const READING_DIRECTIONS = [
  { id: 'ltr', label: 'Kiri ke Kanan' },
  { id: 'rtl', label: 'Kanan ke Kiri' },
] as const;

const TOOLBAR_BEHAVIORS = [
  { id: 'auto-hide', label: 'Auto Sembunyi' },
  { id: 'always-visible', label: 'Selalu Tampil' },
] as const;

const PRELOAD_INTENSITIES = [
  { id: 'light', label: 'Ringan' },
  { id: 'balanced', label: 'Normal' },
  { id: 'aggressive', label: 'Maksimal' },
] as const;

interface ReaderSettingsOptionProps<T extends string> {
  icon: React.ReactNode;
  title: string;
  options: readonly { id: T, label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function ReaderSettingsOption<T extends string>({
  icon,
  title,
  options,
  value,
  onChange
}: ReaderSettingsOptionProps<T>) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-bold text-text-primary">{title}</span>
        </div>
      </div>
      <div className="flex bg-surface-base/80 dark:bg-surface-base/60 p-1 rounded-xl border border-white/5 shadow-inner">
        {options.map(mode => (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors",
              value === mode.id 
                ? "bg-surface-overlay text-text-primary ring-1 ring-border-default/50" 
                : "text-text-primary/70 hover:text-text-primary hover:bg-surface-raised/50"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReaderSettingsDrawer({ isOpen, onClose }: ReaderSettingsDrawerProps) {
  const { preferences, updatePreferences, isDesktopPanelOpen, toggleDesktopPanel } = useReaderStore()

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn( "fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-150 md:hidden", isOpen ? "opacity-100" : "opacity-0 pointer-events-none" )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn( "fixed inset-x-0 bottom-0 max-h-[85vh] md:max-h-screen md:inset-y-0 md:left-auto md:right-0 md:w-80 md:bottom-auto bg-surface-base/30 backdrop-blur-2xl flex flex-col z-[70]", "transition-transform duration-150 ease-out rounded-t-3xl md:rounded-none", isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0" )}
      >
        <div className="flex h-[calc(var(--mobile-header-height)+var(--safe-top))] items-center justify-between px-6 shrink-0 pt-[var(--safe-top)] border-b border-white/5">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-accent" weight="bold" />
            Pengaturan Pembaca
          </h2>
          <div className="bg-surface-raised/60 dark:bg-surface-raised/50 backdrop-blur-xl --glass rounded-full p-1 -sm shrink-0">
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
              
              <div className="bg-surface-raised/60 dark:bg-surface-raised/50 rounded-2xl border border-white/10 overflow-hidden flex flex-col divide-y divide-white/10">
                {/* Warna Latar */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ImageSquare size={18} className="text-text-primary/80" weight="fill" />
                      <span className="text-sm font-bold text-text-primary">Warna Latar</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {BACKGROUNDS.map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => updatePreferences({ background: bg.value })}
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

                <ReaderSettingsOption
                  icon={<ArrowsOutLineVertical size={18} className="text-text-primary/80" weight="fill" />}
                  title="Ukuran Komik"
                  options={IMAGE_FITS}
                  value={preferences.imageFit}
                  onChange={(val) => updatePreferences({ imageFit: val })}
                />

                <ReaderSettingsOption
                  icon={<BoundingBox size={18} className="text-text-primary/80" weight="fill" />}
                  title="Jarak Antar Halaman"
                  options={PAGE_GAPS}
                  value={preferences.pageGap}
                  onChange={(val) => updatePreferences({ pageGap: val })}
                />
              </div>
            </div>

            {/* Perilaku */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-primary/90 px-2 uppercase tracking-wider drop-shadow-sm">Perilaku</h3>
              
              <div className="bg-surface-raised/60 dark:bg-surface-raised/50 rounded-2xl border border-white/10 overflow-hidden flex flex-col divide-y divide-white/10">
                <ReaderSettingsOption
                  icon={<Layout size={18} className="text-text-primary/80" weight="fill" />}
                  title="Arah Baca Paged"
                  options={READING_DIRECTIONS}
                  value={preferences.readingDirection}
                  onChange={(val) => updatePreferences({ readingDirection: val })}
                />

                <ReaderSettingsOption
                  icon={<Layout size={18} className="text-text-primary/80" weight="fill" />}
                  title="Menu Navigasi"
                  options={TOOLBAR_BEHAVIORS}
                  value={preferences.toolbarBehavior}
                  onChange={(val) => updatePreferences({ toolbarBehavior: val })}
                />

                <ReaderSettingsOption
                  icon={<Lightning size={18} className="text-text-primary/80" weight="fill" />}
                  title="Kecepatan Muat"
                  options={PRELOAD_INTENSITIES}
                  value={preferences.preloadIntensity}
                  onChange={(val) => updatePreferences({ preloadIntensity: val })}
                />
              </div>
            </div>

            {/* Fitur Tambahan */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-primary/90 px-2 uppercase tracking-wider drop-shadow-sm">Fitur Tambahan</h3>
              
              <div className="bg-surface-raised/60 dark:bg-surface-raised/50 rounded-2xl border border-white/10 overflow-hidden flex flex-col divide-y divide-white/10">
                {/* Progress Halaman */}
                <label className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-surface-raised/50">
                  <span className="text-sm font-bold text-text-primary">Progress Halaman</span>
                  <ToggleSwitch 
                    checked={preferences.showPageProgress} 
                    onCheckedChange={(checked) => updatePreferences({ showPageProgress: checked })} 
                  />
                </label>

                {/* Layar Selalu Menyala */}
                <label className="flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-surface-raised/50">
                  <span className="text-sm font-bold text-text-primary">Layar Selalu Menyala</span>
                  <ToggleSwitch 
                    checked={preferences.keepScreenAwake ?? true} 
                    onCheckedChange={(checked) => updatePreferences({ keepScreenAwake: checked })} 
                  />
                </label>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}
