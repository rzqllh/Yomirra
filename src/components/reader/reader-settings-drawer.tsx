"use client"

import * as React from "react"
import { SlidersHorizontal, ImageSquare, Layout, Lightning, BoundingBox, ArrowsOutLineVertical } from "@phosphor-icons/react"
import { useReaderStore } from "@/shared/store/reader-store"
import { cn } from "@/shared/utils/cn"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { ReaderPanelShell } from "./reader-panel-shell"

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId?: string;
  mangaId?: string;
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
  { id: 'auto-hide', label: 'Sembunyikan otomatis' },
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
      <div className="flex bg-surface-raised p-1 rounded-xl border border-border-subtle shadow-inner">
        {options.map(mode => (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors outline-none",
              value === mode.id 
                ? "bg-surface-overlay text-text-primary ring-1 ring-border-default/50" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReaderSettingsDrawer({ isOpen, onClose, sourceId, mangaId }: ReaderSettingsDrawerProps) {
  const globalPrefs = useReaderStore((state) => state.preferences);
  const updatePreferences = useReaderStore((state) => state.updatePreferences);
  const titleKey = sourceId && mangaId ? `${sourceId}::${mangaId}` : null;
  const perTitlePrefs = useReaderStore((state) => (titleKey ? state.perTitlePreferences[titleKey] : undefined));
  const updateTitlePreferences = useReaderStore((state) => state.updateTitlePreferences);
  const resetTitlePreferences = useReaderStore((state) => state.resetTitlePreferences);
  const isDesktopPanelOpen = useReaderStore((state) => state.isDesktopPanelOpen);
  const toggleDesktopPanel = useReaderStore((state) => state.toggleDesktopPanel);

  const isPerTitleContext = Boolean(sourceId && mangaId);
  const hasPerTitleOverride = Boolean(perTitlePrefs && Object.keys(perTitlePrefs).length > 0);

  // Scope: 'title' (Khusus judul ini) or 'global' (Semua komik)
  const [scope, setScope] = React.useState<"title" | "global">("title");

  // Effective preferences:
  const preferences = React.useMemo(() => {
    if (isPerTitleContext && perTitlePrefs) {
      return { ...globalPrefs, ...perTitlePrefs };
    }
    return globalPrefs;
  }, [isPerTitleContext, globalPrefs, perTitlePrefs]);

  const handleUpdate = React.useCallback(
    (patch: Partial<Parameters<typeof updatePreferences>[0]>) => {
      if (isPerTitleContext && scope === "title" && sourceId && mangaId) {
        updateTitlePreferences(sourceId, mangaId, patch);
      } else {
        updatePreferences(patch);
      }
    },
    [isPerTitleContext, scope, sourceId, mangaId, updateTitlePreferences, updatePreferences]
  );

  const handleResetTitle = React.useCallback(() => {
    if (sourceId && mangaId) {
      resetTitlePreferences(sourceId, mangaId);
    }
  }, [sourceId, mangaId, resetTitlePreferences]);

  // On desktop (>=768px), settings drawer visibility is also driven by store's isDesktopPanelOpen
  const effectiveIsOpen = React.useMemo(() => {
    if (isOpen) return true;
    if (typeof window !== "undefined" && window.innerWidth >= 768 && isDesktopPanelOpen) {
      return true;
    }
    return false;
  }, [isOpen, isDesktopPanelOpen]);

  const handleClose = React.useCallback(() => {
    onClose();
    if (typeof window !== "undefined" && window.innerWidth >= 768 && isDesktopPanelOpen) {
      toggleDesktopPanel();
    }
  }, [onClose, isDesktopPanelOpen, toggleDesktopPanel]);

  return (
    <ReaderPanelShell
      isOpen={effectiveIsOpen}
      onClose={handleClose}
      title="Pengaturan pembaca"
      icon={<SlidersHorizontal size={20} weight="bold" />}
      desktopMode="side-panel"
      contentClassName="p-5 space-y-6 overscroll-contain pb-[calc(24px+var(--safe-bottom))]"
    >

      {/* Scope Selector: Khusus judul ini vs Semua komik (Q8/Q86) */}
      {isPerTitleContext && (
        <div className="p-3 bg-surface-raised rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary">Cakupan Pengaturan</span>
            {hasPerTitleOverride && (
              <button
                type="button"
                onClick={handleResetTitle}
                className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
              >
                Reset ke default
              </button>
            )}
          </div>
          <div className="flex bg-surface-base p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setScope("title")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-colors outline-none cursor-pointer",
                scope === "title"
                  ? "bg-accent text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Khusus judul ini {hasPerTitleOverride && "•"}
            </button>
            <button
              type="button"
              onClick={() => setScope("global")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-colors outline-none cursor-pointer",
                scope === "global"
                  ? "bg-accent text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Semua komik
            </button>
          </div>
          <p className="text-[11px] text-text-muted leading-tight">
            {scope === "title"
              ? "Perubahan hanya berlaku untuk komik yang sedang dibaca."
              : "Perubahan akan menjadi preferensi default untuk semua komik."}
          </p>
        </div>
      )}

      {/* Tampilan */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-text-muted px-1 flex items-center gap-1.5">
          <Layout size={14} weight="bold" /> Tampilan & Tema
        </div>
        
        {/* Warna Latar Belakang */}
        <div className="p-4 bg-surface-base rounded-xl border border-border-subtle flex flex-col gap-3">
          <span className="text-sm font-bold text-text-primary">Warna Latar Belakang</span>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUNDS.map((bg) => {
              const isSelected = preferences.background === bg.value;
              return (
                <button
                  key={bg.value}
                  onClick={() => handleUpdate({ background: bg.value })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all outline-none",
                    isSelected 
                      ? "border-accent bg-accent/10 shadow-xs ring-1 ring-accent" 
                      : "border-border-subtle bg-surface-raised hover:bg-surface-hover"
                  )}
                >
                  <div 
                    className={cn("w-6 h-6 rounded-full shadow-inner border", bg.border)}
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className={cn(
                    "text-xs font-bold truncate w-full text-center",
                    isSelected ? "text-accent" : "text-text-secondary"
                  )}>
                    {bg.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mode Baca & Gambar */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-text-muted px-1 flex items-center gap-1.5">
          <ImageSquare size={14} weight="bold" /> Penyesuaian Gambar
        </div>

        <div className="bg-surface-base rounded-xl border border-border-subtle divide-y divide-border-subtle">
          <ReaderSettingsOption
            icon={<BoundingBox size={18} className="text-accent" weight="bold" />}
            title="Ukuran gambar"
            options={IMAGE_FITS}
            value={preferences.imageFit}
            onChange={(val) => handleUpdate({ imageFit: val })}
          />

          <ReaderSettingsOption
            icon={<ArrowsOutLineVertical size={18} className="text-accent" weight="bold" />}
            title="Jarak Antar Halaman"
            options={PAGE_GAPS}
            value={preferences.pageGap}
            onChange={(val) => handleUpdate({ pageGap: val })}
          />

          <ReaderSettingsOption
            icon={<Layout size={18} className="text-accent" weight="bold" />}
            title="Arah baca"
            options={READING_DIRECTIONS}
            value={preferences.readingDirection}
            onChange={(val) => handleUpdate({ readingDirection: val })}
          />
        </div>
      </div>

      {/* Kontrol & Performa */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-text-muted px-1 flex items-center gap-1.5">
          <Lightning size={14} weight="bold" /> Kontrol & Performa
        </div>

        <div className="bg-surface-base rounded-xl border border-border-subtle divide-y divide-border-subtle">
          <ReaderSettingsOption
            icon={<SlidersHorizontal size={18} className="text-accent" weight="bold" />}
            title="Kontrol pembaca"
            options={TOOLBAR_BEHAVIORS}
            value={preferences.toolbarBehavior}
            onChange={(val) => handleUpdate({ toolbarBehavior: val })}
          />

          <ReaderSettingsOption
            icon={<Lightning size={18} className="text-accent" weight="bold" />}
            title="Muat awal gambar"
            options={PRELOAD_INTENSITIES}
            value={preferences.preloadIntensity}
            onChange={(val) => handleUpdate({ preloadIntensity: val })}
          />

          <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Progres halaman</span>
            <ToggleSwitch
              id="show-page-progress"
              checked={preferences.showPageProgress}
              onCheckedChange={(checked) => handleUpdate({ showPageProgress: checked })}
              label="Progres halaman"
            />
          </div>
        </div>
      </div>
    </ReaderPanelShell>
  )
}
