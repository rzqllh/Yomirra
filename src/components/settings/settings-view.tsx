"use client";

import * as React from "react";
import { UserCircle, Broom, Palette, WifiHigh, Fire, ArrowsClockwise, DeviceMobile, FileText, Clock, Bell, X, Compass, Globe } from "@phosphor-icons/react";
import { BackupRestoreModal } from "@/components/settings/backup-restore-modal";
import { useAuth } from "@/shared/hooks/use-auth";
import { useSync } from "@/shared/hooks/use-sync";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore, type SourceRoutingMode } from "@/shared/store/settings-store";
import { useStatsStore } from "@/shared/store/stats-store";
import { useTheme } from "next-themes";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { CustomSelect } from "@/components/ui/custom-select";
import { YomirraSurface } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Gear, ShieldWarning } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { SettingsSection, SettingsItem, IconWrapper } from "@/app/(web)/settings/components/settings-ui";
import { cn } from "@/shared/utils/cn";
import { clearAutomaticCache, getStorageEstimate } from "@/shared/lib/reading-buffer";

export interface SettingsViewProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function SettingsView({ isOverlay = false, onClose }: SettingsViewProps) {
  const { user } = useAuth();
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearLibrary = useLibraryStore((state) => state.clearLibrary);
  const {
    dataSaver, setDataSaver, hideNsfw, setHideNsfw, lastSyncedAt, keepScreenAwake, setKeepScreenAwake,
    checkOnAppStart, setCheckOnAppStart, minimumCheckIntervalMinutes, setMinimumCheckIntervalMinutes,
    notifyForAllLibraryItems, setNotifyForAllLibraryItems,
    routingMode, setRoutingMode, preferredLanguages, setPreferredLanguages, globalSourceOrder, setGlobalSourceOrder
  } = useSettingsStore();
  const totalReadingTimeMs = useStatsStore((state) => state.totalReadingTimeMs);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = React.useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = React.useState(false);
  const [isClearingCache, setIsClearingCache] = React.useState(false);
  const [storageUsage, setStorageUsage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mounted) {
      getStorageEstimate().then((est) => {
        if (est) {
          setStorageUsage(`${est.usageMB} MB / ${est.quotaMB} MB`);
        }
      });
    }
  }, [mounted]);

  const handleClearAutomaticCache = async () => {
    setIsClearingCache(true);
    try {
      await clearAutomaticCache();
      toast.success("Cache sementara dan buffer baca berhasil dibersihkan");
      const est = await getStorageEstimate();
      if (est) {
        setStorageUsage(`${est.usageMB} MB / ${est.quotaMB} MB`);
      }
    } catch {
      toast.error("Gagal membersihkan cache");
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearData = () => {
    setIsClearDataDialogOpen(true);
  };

  const confirmClearData = () => {
    clearHistory();
    clearLibrary();
    toast.success("Data lokal berhasil dibersihkan");
    setIsClearDataDialogOpen(false);
  };

  const formatReadingTime = () => {
    if (!totalReadingTimeMs) return "Belum ada riwayat baca";
    const minutes = Math.floor(totalReadingTimeMs / 60000);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return `${hours} jam ${remMins > 0 ? `${remMins} menit` : ""}`;
  };

  const settingsContent = (
    <div className={cn("space-y-6 md:space-y-8", isOverlay ? "pb-8" : "xl:columns-2 xl:gap-6 [&>*]:break-inside-avoid xl:[&>*]:mb-6")}>
      {/* Akun & Profil */}
      <SettingsSection title="Akun & Profil">
        {user ? (
          <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    width={56} 
                    height={56} 
                    className="rounded-xl border border-border-default/60 shadow-xs object-cover"
                    referrerPolicy="no-referrer" 
                    unoptimized 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shadow-xs">
                    <UserCircle size={32} weight="duotone" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-overlay flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-semantic-success" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-text-primary truncate leading-tight">
                  {user.displayName}
                </h3>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {user.email}
                </p>
                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-semantic-success/10 border border-semantic-success/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-semantic-success">
                    Sync Cloud Aktif
                  </span>
                </div>
              </div>
            </div>

            <Link href="/account" className="block outline-none pt-1">
              <Button variant="secondary" className="w-full rounded-xl justify-between h-10 px-4 text-xs font-bold">
                <span className="flex items-center gap-2">
                  <UserCircle size={18} weight="duotone" className="text-accent" />
                  Kelola Akun & Sinkronisasi Cloud
                </span>
                <span>&rarr;</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3">
            <div>
              <h3 className="text-base font-bold text-text-primary">Login untuk Sinkronisasi</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md">Masuk dengan Google untuk mengaktifkan sinkronisasi otomatis History dan Readlist lintas perangkat.</p>
            </div>
            <Link href="/account" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto rounded-xl font-bold shadow-xs text-xs">
                <UserCircle size={18} className="mr-1.5" weight="bold" />
                Buka Halaman Akun
              </Button>
            </Link>
          </div>
        )}
      </SettingsSection>

      {/* Statistik Membaca */}
      <SettingsSection title="Statistik Membaca">
        <SettingsItem
          icon={<IconWrapper variant="accent"><Fire size={20} weight="duotone" /></IconWrapper>}
          title="Waktu Membaca"
          description={formatReadingTime()}
          right={<div className="text-sm font-semibold text-text-primary hidden sm:block">{formatReadingTime()}</div>}
        />
      </SettingsSection>

      {/* Pembaruan Library */}
      <SettingsSection title="Pembaruan Library">
        <SettingsItem
          icon={<IconWrapper><ArrowsClockwise size={20} weight="duotone" /></IconWrapper>}
          title="Cek Otomatis Saat Dibuka"
          description="Periksa chapter baru secara otomatis saat aplikasi dimulai."
          right={
            <ToggleSwitch
              id="check-on-start"
              checked={mounted ? checkOnAppStart : true}
              onCheckedChange={setCheckOnAppStart}
              label="Cek Otomatis Saat Dibuka"
            />
          }
        />

        <div className="mx-3 my-1 border-b border-border-subtle/50" />

        <SettingsItem
          icon={<IconWrapper><Clock size={20} weight="duotone" /></IconWrapper>}
          title="Interval Pengecekan"
          description="Batas waktu jeda (cooldown) untuk pengecekan otomatis berikutnya."
          right={
            <CustomSelect
              value={String(mounted ? minimumCheckIntervalMinutes : 15)}
              onChange={(val) => setMinimumCheckIntervalMinutes(Number(val))}
              options={[
                { value: "15", label: "15 Menit" },
                { value: "30", label: "30 Menit" },
                { value: "60", label: "1 Jam" },
                { value: "360", label: "6 Jam" },
                { value: "720", label: "12 Jam" },
              ]}
              className={!checkOnAppStart ? "opacity-50 pointer-events-none" : ""}
            />
          }
        />

        <div className="mx-3 my-1 border-b border-border-subtle/50" />

        <SettingsItem
          icon={<IconWrapper><Bell size={20} weight="duotone" /></IconWrapper>}
          title="Notifikasi Global"
          description="Tandai update baru sebagai belum dibaca pada badge navigasi."
          right={
            <ToggleSwitch
              id="notify-all"
              checked={mounted ? notifyForAllLibraryItems : true}
              onCheckedChange={setNotifyForAllLibraryItems}
              label="Tandai update baru sebagai belum dibaca"
            />
          }
        />
      </SettingsSection>

      {/* Preferensi Sumber & Smart Routing (Phase 6) */}
      <SettingsSection title="Preferensi Sumber & Routing">
        <SettingsItem
          icon={<IconWrapper><Compass size={20} weight="duotone" /></IconWrapper>}
          title="Mode Routing Sumber"
          description="Atur cara Yomirra menangani sumber komik yang lambat atau mengalami gangguan."
          right={
            <CustomSelect
              value={mounted ? routingMode : "PREFERRED"}
              onChange={(val) => setRoutingMode(val as SourceRoutingMode)}
              options={[
                { value: "PREFERRED", label: "Prioritas (Rekomendasi)" },
                { value: "AUTO_SAFE", label: "Otomatis Aman" },
                { value: "MANUAL", label: "Manual" },
              ]}
            />
          }
        />

        <div className="mx-3 my-1 border-b border-border-subtle/50" />

        <SettingsItem
          icon={<IconWrapper><Globe size={20} weight="duotone" /></IconWrapper>}
          title="Bahasa Utama"
          description="Bahasa terjemahan yang diprioritaskan saat memilih sumber komik."
          right={
            <CustomSelect
              value={mounted ? (preferredLanguages[0] || "id") : "id"}
              onChange={(val) => {
                const rest = preferredLanguages.filter((l) => l !== val);
                setPreferredLanguages([val, ...rest]);
              }}
              options={[
                { value: "id", label: "Bahasa Indonesia" },
                { value: "en", label: "English" },
              ]}
            />
          }
        />

        <div className="mx-3 my-1 border-b border-border-subtle/50" />

        <SettingsItem
          icon={<IconWrapper><ArrowsClockwise size={20} weight="duotone" /></IconWrapper>}
          title="Sumber Utama Teratas"
          description="Sumber urutan pertama yang diprioritaskan ketika membaca."
          right={
            <CustomSelect
              value={mounted ? (globalSourceOrder[0] || "mangadex") : "mangadex"}
              onChange={(val) => {
                const rest = globalSourceOrder.filter((s) => s !== val);
                setGlobalSourceOrder([val, ...rest]);
              }}
              options={[
                { value: "mangadex", label: "MangaDex" },
                { value: "komiku", label: "Komiku" },
                { value: "komiknesia", label: "KomikNesia" },
                { value: "komikindo", label: "Komikindo" },
                { value: "komiku-ii", label: "Komiku II" },
                { value: "asurascans", label: "Asura Scans" },
                { value: "shinigami", label: "Shinigami" },
              ]}
            />
          }
        />
      </SettingsSection>

      {/* Preferensi Tampilan */}
      <SettingsSection title="Preferensi Tampilan">
        <SettingsItem
          className="md:hidden"
          wrapOnMobile
          icon={<IconWrapper><Palette size={20} weight="duotone" /></IconWrapper>}
          title="Tema Aplikasi"
          description="Pilih tema terang atau gelap."
          right={
            mounted ? (
              <SegmentedControl
                layoutId="theme-toggle"
                variant="quick-rail"
                options={[
                  { value: "light", label: "Terang" },
                  { value: "dark", label: "Gelap" },
                  { value: "system", label: "Sistem" },
                ]}
                value={theme || "system"}
                onChange={(val) => setTheme(val)}
                className="w-full sm:w-auto"
              />
            ) : (
              <SegmentedControl
                layoutId="theme-toggle-skeleton"
                variant="quick-rail"
                options={[
                  { value: "light", label: "Terang" },
                  { value: "dark", label: "Gelap" },
                  { value: "system", label: "Sistem" },
                ]}
                value="system"
                onChange={() => {}}
                className="w-full sm:w-auto opacity-50"
              />
            )
          }
        />

        <div className="mx-3 my-1 border-b border-border-subtle/50 md:hidden" />

        <SettingsItem
          icon={<IconWrapper><WifiHigh size={20} weight="duotone" /></IconWrapper>}
          title="Penghemat Data"
          description="Muat gambar resolusi rendah."
          right={
            <ToggleSwitch 
              id="data-saver" 
              checked={mounted ? dataSaver : false}
              onCheckedChange={setDataSaver}
              label="Penghemat Data"
            />
          }
        />
        
        <div className="mx-3 my-1 border-b border-border-subtle/50" />

        <SettingsItem
          icon={<IconWrapper><DeviceMobile size={20} weight="duotone" /></IconWrapper>}
          title="Layar Selalu Menyala"
          description="Layar tetap menyala saat mendownload chapter offline."
          right={
            <ToggleSwitch 
              id="keep-awake" 
              checked={mounted ? keepScreenAwake : true}
              onCheckedChange={setKeepScreenAwake}
              label="Layar Selalu Menyala"
            />
          }
        />
      </SettingsSection>

      {/* Konten & Keamanan */}
      <SettingsSection title="Konten & Keamanan">
        <SettingsItem
          icon={<IconWrapper><ShieldWarning size={20} weight="duotone" /></IconWrapper>}
          title="Sembunyikan NSFW"
          description="Saring konten dewasa di sumber."
          right={
            <ToggleSwitch 
              id="nsfw-toggle" 
              checked={mounted ? hideNsfw : true}
              onCheckedChange={setHideNsfw}
              label="Sembunyikan NSFW"
            />
          }
        />
      </SettingsSection>

      {/* Backup & Restore */}
      <SettingsSection title="Cadangan Data">
        <SettingsItem
          icon={<IconWrapper variant="accent"><FileText size={20} weight="duotone" /></IconWrapper>}
          title="Backup & Restore Data"
          description="Simpan ke file JSON atau pulihkan data riwayat & koleksi lokal."
          right={
            <Button onClick={() => setIsBackupModalOpen(true)} variant="outline" className="w-full sm:w-auto shrink-0 border-accent/40 text-accent hover:bg-accent hover:text-white rounded-xl font-bold transition-colors">
              Kelola Backup
            </Button>
          }
        />
      </SettingsSection>

      {/* Data Lokal */}
      <SettingsSection title={user ? "Data Perangkat" : "Data Lokal"}>
        <SettingsItem
          icon={<IconWrapper><Broom size={20} weight="duotone" /></IconWrapper>}
          title="Cache Sementara & Buffer Baca"
          description={`Bersihkan cache metadata dan buffer bab offline otomatis tanpa menghapus bab yang diunduh.${storageUsage ? ` (Penyimpanan: ${storageUsage})` : ""}`}
          right={
            <Button
              onClick={handleClearAutomaticCache}
              variant="outline"
              disabled={isClearingCache}
              className="w-full sm:w-auto shrink-0 rounded-xl font-bold transition-colors"
            >
              {isClearingCache ? "Membersihkan..." : "Bersihkan Cache"}
            </Button>
          }
        />

        <div className="mx-3 my-1 border-b border-border-subtle/50" />

        <SettingsItem
          icon={<IconWrapper variant="danger"><Broom size={20} weight="duotone" /></IconWrapper>}
          title={user ? "Bersihkan Cache Perangkat" : "Hapus Data Lokal"}
          description={user ? "Menghapus data lokal di perangkat ini (tidak menghapus cloud)." : "Menghapus akan mereset riwayat & readlist secara permanen."}
          right={
            <Button onClick={handleClearData} variant="outline" className="w-full sm:w-auto shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/50 rounded-xl font-bold transition-colors">
              Bersihkan
            </Button>
          }
        />
      </SettingsSection>

      {/* Version */}
      <div className="flex justify-center pt-2 pb-2">
        <span className="text-xs text-text-muted font-medium select-none">
          Yomirra v1.0.0
        </span>
      </div>
    </div>
  );

  return (
    <>
      {isOverlay ? (
        <div className="flex flex-col h-full max-h-[90vh] bg-surface-base">
          {/* Overlay Header Chrome */}
          <div className="pt-3 pb-3 px-5 sm:px-6 shrink-0 flex flex-col border-b border-border-subtle bg-surface-base/95 backdrop-blur-md sticky top-0 z-20">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-border-strong mb-3 sm:hidden" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Gear size={20} weight="duotone" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary leading-tight">Pengaturan</h2>
                  <p className="text-[11px] text-text-muted">Preferensi aplikasi Yomirra</p>
                </div>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-surface-raised hover:bg-surface-hover flex items-center justify-center text-text-primary transition-colors cursor-pointer border border-border-subtle"
                  aria-label="Tutup pengaturan"
                >
                  <X size={18} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Overlay Content */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 [scrollbar-width:none] touch-manipulation"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {settingsContent}
          </div>
        </div>
      ) : (
        <YomirraSurface variant="base" className="min-h-screen">
          <div className="mx-auto flex w-full max-w-7xl flex-col">
            <h1 className="sr-only">Pengaturan Yomirra</h1>
            <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 pb-6 md:px-8 space-y-8">
              <PageHeader 
                title="Pengaturan" 
                description="Sesuaikan preferensi aplikasi sesuai keinginanmu."
                icon={<Gear size={24} weight="duotone" />}
              />
              <div className="w-full">
                {settingsContent}
              </div>
            </div>
          </div>
        </YomirraSurface>
      )}

      <BackupRestoreModal isOpen={isBackupModalOpen} onOpenChange={setIsBackupModalOpen} />

      <ConfirmationModal
        isOpen={isClearDataDialogOpen}
        onOpenChange={setIsClearDataDialogOpen}
        title="Bersihkan Data Perangkat?"
        description={
          user
            ? "Ini akan menghapus riwayat dan koleksi di perangkat ini. Data di cloud tetap aman dan akan dimuat ulang saat sinkronisasi berikutnya."
            : "Semua riwayat bacaan dan koleksi akan dihapus permanen. Karena kamu belum login, data ini tidak bisa dipulihkan."
        }
        confirmLabel="Bersihkan"
        cancelLabel="Batal"
        variant="danger"
        requireCheckbox={
          user
            ? "Saya mengerti data lokal di perangkat ini akan dihapus"
            : "Saya mengerti data ini akan hilang permanen dan tidak bisa dipulihkan"
        }
        onConfirm={confirmClearData}
      />
    </>
  );
}
