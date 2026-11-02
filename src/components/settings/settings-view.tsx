"use client";

import * as React from "react";
import packageInfo from "../../../package.json";
import {
  UserCircle,
  Broom,
  Palette,
  WifiHigh,
  Fire,
  ArrowsClockwise,
  DeviceMobile,
  FileText,
  Clock,
  Bell,
  Compass,
  Globe,
  Trash,
  CaretLeft,
  DownloadSimple,
  ShieldWarning,
  Sparkle,
} from "@phosphor-icons/react";
import { BackupRestoreView } from "@/components/settings/backup-restore-modal";
import { useAuth } from "@/shared/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useOnboardingStore } from "@/shared/store/onboarding-store";
import { useStatsStore } from "@/shared/store/stats-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { useTheme } from "next-themes";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { CustomSelect } from "@/components/ui/custom-select";
import { YomirraSurface, PageContainer, ContentLane } from "@/components/ui/layout";
import { PageHeader } from "@/components/chrome/header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Gear } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { SettingsSection, SettingsItem, IconWrapper } from "@/app/(web)/settings/components/settings-ui";
import { clearAutomaticCache } from "@/shared/lib/reading-buffer";
import { clearSharedDeviceData } from "@/shared/lib/local-data-cleanup";
import {
  getYomirraStorageBreakdown,
  clearAllDownloadsCache,
  type YomirraStorageBreakdown,
} from "@/shared/lib/yomirra-storage";

export interface SettingsViewProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function SettingsView({ isOverlay = false, onClose }: SettingsViewProps) {
  const { user, logout } = useAuth();
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearLibrary = useLibraryStore((state) => state.clearLibrary);
  const clearDownloadsStore = useDownloadStore((state) => state.clearDownloads);

  const {
    dataSaver,
    setDataSaver,
    hideNsfw,
    setHideNsfw,
    keepScreenAwake,
    setKeepScreenAwake,
    checkOnAppStart,
    setCheckOnAppStart,
    minimumCheckIntervalMinutes,
    setMinimumCheckIntervalMinutes,
    notifyForAllLibraryItems,
    setNotifyForAllLibraryItems,
    preferredLanguages,
    setPreferredLanguages,
  } = useSettingsStore();

  const totalReadingTimeMs = useStatsStore((state) => state.totalReadingTimeMs);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const [subView, setSubView] = React.useState<"main" | "backup">("main");
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = React.useState(false);
  const [isClearDownloadsDialogOpen, setIsClearDownloadsDialogOpen] = React.useState(false);
  const [isSharedDeviceDialogOpen, setIsSharedDeviceDialogOpen] = React.useState(false);
  const [isClearingCache, setIsClearingCache] = React.useState(false);
  const [isClearingDownloads, setIsClearingDownloads] = React.useState(false);
  const [isClearingDevice, setIsClearingDevice] = React.useState(false);
  const [storageData, setStorageData] = React.useState<YomirraStorageBreakdown | null>(null);

  // Load real Yomirra storage breakdown
  const refreshStorage = React.useCallback(async () => {
    try {
      const breakdown = await getYomirraStorageBreakdown();
      setStorageData(breakdown);
    } catch {
      // Non-critical
    }
  }, []);

  React.useEffect(() => {
    if (mounted) {
      refreshStorage();
    }
  }, [mounted, refreshStorage]);

  // Enforce auth requirement: guest users cannot turn NSFW ON
  React.useEffect(() => {
    if (mounted && !user && !hideNsfw) {
      setHideNsfw(true);
    }
  }, [mounted, user, hideNsfw, setHideNsfw]);

  const handleClearAutomaticCache = async () => {
    setIsClearingCache(true);
    try {
      await clearAutomaticCache();
      toast.success("Cache bacaan dibersihkan", {
        description: "Gambar dan data sementara dihapus dari penyimpanan perangkat.",
      });
      await refreshStorage();
    } catch {
      toast.error("Cache gagal dibersihkan", {
        description: "Penyimpanan sementara tidak dapat dibersihkan saat ini.",
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const confirmClearDownloads = async () => {
    setIsClearingDownloads(true);
    try {
      await clearAllDownloadsCache();
      await clearDownloadsStore();
      toast.success("Unduhan bab dihapus", {
        description: "Semua bab komik yang diunduh untuk dibaca offline telah dibersihkan.",
      });
      await refreshStorage();
    } catch {
      toast.error("Unduhan gagal dibersihkan");
    } finally {
      setIsClearingDownloads(false);
      setIsClearDownloadsDialogOpen(false);
    }
  };

  const confirmClearData = () => {
    clearHistory();
    clearLibrary();
    toast.info("Riwayat & bookmark lokal dihapus", {
      description: "Unduhan dan cache bacaan tetap tersimpan di perangkat ini.",
    });
    setIsClearDataDialogOpen(false);
    refreshStorage();
  };

  const confirmSharedDeviceCleanup = async () => {
    setIsClearingDevice(true);
    try {
      if (user) {
        await logout();
      }
      await clearSharedDeviceData();
      setIsSharedDeviceDialogOpen(false);
      toast.success("Data perangkat dibersihkan", {
        description: "Akun, data baca lokal, unduhan, dan cache telah dibersihkan.",
      });
      window.location.replace("/");
    } catch {
      toast.error("Data perangkat gagal dibersihkan", {
        description: "Sebagian data mungkin masih tersimpan. Coba lagi.",
      });
    } finally {
      setIsClearingDevice(false);
    }
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
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* Kolom Kiri: Akun, Preferensi & Tampilan */}
      <div className="flex min-w-0 flex-col gap-6">
        {/* Kategori 1: Akun & Preferensi Membaca */}
        <SettingsSection title="1. Akun & Preferensi Membaca">
          {user ? (
            <div className="flex flex-col gap-3 p-3">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={52}
                      height={52}
                      className="rounded-xl border border-border-default shadow-xs object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  ) : (
                    <div className="size-13 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shadow-xs">
                      <UserCircle size={30} weight="regular" />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-surface-overlay flex items-center justify-center border border-border-default">
                    <div className="size-2 rounded-full bg-semantic-success" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text-primary truncate leading-tight">
                    {user.displayName}
                  </h3>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {user.email}
                  </p>
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-semantic-success/10 text-[10px] font-bold uppercase tracking-wider text-semantic-success border border-semantic-success/20">
                    Akun terhubung
                  </span>
                </div>
              </div>

              <Link href="/account" className="block outline-none pt-1">
                <Button variant="secondary" className="w-full rounded-xl justify-between h-10 px-4 text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <UserCircle size={17} weight="regular" className="text-accent" />
                    Kelola akun &amp; sinkronisasi
                  </span>
                  <span>&rarr;</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 bg-surface-base/60 rounded-xl m-1 border border-border-subtle">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Masuk untuk sinkronisasi</h3>
                <p className="text-xs text-text-secondary mt-0.5 max-w-sm leading-relaxed">
                  Sinkronkan bookmark, riwayat baca, dan preferensi lintas perangkat secara otomatis.
                </p>
              </div>
              <Link href="/account" className="w-full sm:w-auto shrink-0">
                <Button variant="primary" className="w-full sm:w-auto rounded-xl font-bold shadow-xs text-xs">
                  <UserCircle size={16} className="mr-1.5" weight="regular" />
                  Buka akun
                </Button>
              </Link>
            </div>
          )}

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* Bahasa Utama */}
          <SettingsItem
            icon={<IconWrapper><Globe size={19} weight="regular" /></IconWrapper>}
            title="Bahasa utama"
            description="Prioritas bahasa saat memuat bab komik dari sumber yang mendukung."
            right={
              <CustomSelect
                label="Bahasa utama"
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

          {/* Pembaruan Otomatis */}
          <SettingsItem
            icon={<IconWrapper><ArrowsClockwise size={19} weight="regular" /></IconWrapper>}
            title="Cek otomatis saat dibuka"
            description="Periksa ketersediaan chapter baru secara berkala."
            right={
              <ToggleSwitch
                id="check-on-start"
                checked={mounted ? checkOnAppStart : true}
                onCheckedChange={setCheckOnAppStart}
                label="Cek otomatis saat dibuka"
              />
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper><Clock size={19} weight="regular" /></IconWrapper>}
            title="Jeda pengecekan"
            description="Frekuensi interval pemeriksaan chapter baru."
            right={
              <CustomSelect
                label="Jeda pengecekan"
                value={String(mounted ? minimumCheckIntervalMinutes : 15)}
                onChange={(val) => setMinimumCheckIntervalMinutes(Number(val))}
                options={[
                  { value: "15", label: "15 Menit" },
                  { value: "30", label: "30 Menit" },
                  { value: "60", label: "1 Jam" },
                  { value: "360", label: "6 Jam" },
                ]}
                disabled={!checkOnAppStart}
              />
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper><Bell size={19} weight="regular" /></IconWrapper>}
            title="Tandai pembaruan baru"
            description="Tampilkan badge jumlah pembaruan yang belum dilihat di dock navigasi."
            right={
              <ToggleSwitch
                id="notify-all"
                checked={mounted ? notifyForAllLibraryItems : true}
                onCheckedChange={setNotifyForAllLibraryItems}
                label="Tandai pembaruan baru"
              />
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* Waktu Baca */}
          <SettingsItem
            icon={<IconWrapper variant="accent"><Fire size={19} weight="regular" /></IconWrapper>}
            title="Total waktu membaca"
            description="Total durasi aktif membaca komik di Yomirra."
            right={<div className="text-xs font-bold text-text-primary tabular-nums">{formatReadingTime()}</div>}
          />
        </SettingsSection>

        {/* Kategori 2: Tampilan & Antarmuka */}
        <SettingsSection title="2. Tampilan & Antarmuka">
          <SettingsItem
            wrapOnMobile
            icon={<IconWrapper><Palette size={19} weight="regular" /></IconWrapper>}
            title="Tema aplikasi"
            description="Sesuaikan tema warna tampilan Yomirra."
            right={
              mounted ? (
                <SegmentedControl
                  layoutId="theme-toggle"
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
                <div className="h-10 w-44 rounded-xl bg-surface-muted animate-pulse" />
              )
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper><WifiHigh size={19} weight="regular" /></IconWrapper>}
            title="Mode hemat data"
            description="Muat gambar berkualitas kompresi lebih hemat jika didukung oleh sumber."
            right={
              <ToggleSwitch
                id="data-saver"
                checked={mounted ? dataSaver : false}
                onCheckedChange={setDataSaver}
                label="Hemat data"
              />
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper><DeviceMobile size={19} weight="regular" /></IconWrapper>}
            title="Jaga layar tetap menyala"
            description="Cegah layar mati otomatis saat mengunduh atau membaca chapter."
            right={
              <ToggleSwitch
                id="keep-awake"
                checked={mounted ? keepScreenAwake : true}
                onCheckedChange={setKeepScreenAwake}
                label="Jaga layar tetap menyala"
              />
            }
          />
        </SettingsSection>
      </div>

      {/* Kolom Kanan: Konten, Privasi & Penyimpanan */}
      <div className="flex min-w-0 flex-col gap-6">
        {/* Kategori 3: Konten & Privasi */}
        <SettingsSection title="3. Konten & Privasi">
          <SettingsItem
            icon={<IconWrapper><Compass size={19} weight="regular" /></IconWrapper>}
            title="Sumber Jelajah"
            description="Kelola sumber yang aktif untuk Jelajah dan Quick Search."
            right={
              <Link
                href="/sources"
                className="inline-flex min-h-11 items-center rounded-xl border border-border-default px-3.5 text-xs font-bold text-accent hover:border-accent/50 transition-colors"
              >
                Kelola sumber &rarr;
              </Link>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* NSFW Control - Strictly Protected by Auth Boundary */}
          <div className="p-3">
            <SettingsItem
              icon={<IconWrapper variant="danger"><ShieldWarning size={19} weight="regular" /></IconWrapper>}
              title="Tampilkan Konten 18+ (NSFW)"
              description={
                user
                  ? "Nonaktif secara default. Saat diaktifkan, sumber dan komik bertanda dewasa dapat diakses."
                  : "Fitur ini hanya dapat diaktifkan jika kamu sudah masuk dengan akun Google untuk verifikasi usia."
              }
              right={
                user ? (
                  <ToggleSwitch
                    id="nsfw-toggle"
                    checked={mounted ? !hideNsfw : false}
                    onCheckedChange={(showNsfw) => setHideNsfw(!showNsfw)}
                    label="Tampilkan NSFW"
                  />
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-muted text-[11px] font-bold text-text-muted border border-border-subtle">
                    Terkunci
                  </span>
                )
              }
            />

            {!user && (
              <div className="mt-2.5 flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-muted/60 border border-border-subtle">
                <p className="text-xs text-text-muted leading-relaxed">
                  Masuk dengan akun Google untuk mengaktifkan konten dewasa (18+).
                </p>
                <Link
                  href="/account"
                  className="shrink-0 text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
                >
                  <span>Masuk</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Kategori 4: Penyimpanan & Cadangan Data */}
        <SettingsSection title="4. Penyimpanan & Cadangan Data">
          {/* Honest Yomirra Storage Breakdown Card */}
          <div className="p-3">
            <div className="rounded-xl border border-border-subtle bg-surface-base/80 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                    Penyimpanan Terpakai Yomirra
                  </span>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Hanya menghitung berkas dan data yang disimpan oleh aplikasi ini.
                  </p>
                </div>
                <span className="text-base font-black text-text-primary tabular-nums">
                  {storageData ? `${storageData.totalYomirraMB} MB` : "Memuat…"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border-subtle bg-surface-raised p-2.5 flex flex-col justify-between">
                  <span className="text-text-muted font-medium">Cache Gambar Bacaan</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-text-primary tabular-nums">
                      {storageData ? `${storageData.readingCacheMB} MB` : "-"}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {storageData ? `${storageData.entryCounts.readingCache} berkas` : ""}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface-raised p-2.5 flex flex-col justify-between">
                  <span className="text-text-muted font-medium">Unduhan Bab Offline</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-text-primary tabular-nums">
                      {storageData ? `${storageData.downloadsMB} MB` : "-"}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {storageData ? `${storageData.entryCounts.downloads} halaman` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action 1: Clear Reading Cache */}
          <SettingsItem
            icon={<IconWrapper><Broom size={19} weight="regular" /></IconWrapper>}
            title="Bersihkan cache gambar sementara"
            description="Hapus gambar bab sementara tanpa menghapus riwayat baca maupun unduhan offline."
            right={
              <Button
                onClick={handleClearAutomaticCache}
                variant="outline"
                disabled={isClearingCache}
                className="w-full sm:w-auto shrink-0 rounded-xl font-bold text-xs h-9 px-3.5 transition-colors"
              >
                {isClearingCache ? "Membersihkan…" : "Bersihkan cache"}
              </Button>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* Action 2: Clear Offline Downloads */}
          <SettingsItem
            icon={<IconWrapper><DownloadSimple size={19} weight="regular" /></IconWrapper>}
            title="Hapus semua bab offline"
            description="Hapus berkas komik yang diunduh untuk dibaca saat offline."
            right={
              <Button
                onClick={() => setIsClearDownloadsDialogOpen(true)}
                variant="outline"
                disabled={isClearingDownloads || (storageData?.downloadsMB ?? 0) === 0}
                className="w-full sm:w-auto shrink-0 rounded-xl font-bold text-xs h-9 px-3.5 text-text-secondary hover:text-semantic-error hover:border-semantic-error/40 transition-colors"
              >
                Hapus unduhan
              </Button>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* Action 3: Backup & Restore */}
          <SettingsItem
            icon={<IconWrapper variant="accent"><FileText size={19} weight="regular" /></IconWrapper>}
            title="Ekspor / pulihkan cadangan data"
            description="Simpan salinan data komik ke berkas cadangan JSON atau pulihkan riwayat dan koleksi."
            right={
              <Button
                onClick={() => setSubView("backup")}
                variant="outline"
                className="w-full sm:w-auto shrink-0 border-accent/40 text-accent hover:bg-accent hover:text-white rounded-xl font-bold text-xs h-9 px-3.5 transition-colors"
              >
                Kelola cadangan
              </Button>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* Action 4: Clear Local Data */}
          <SettingsItem
            icon={<IconWrapper variant="danger"><Trash size={19} weight="regular" /></IconWrapper>}
            title="Hapus riwayat &amp; bookmark lokal"
            description="Hapus riwayat baca dan bookmark lokal di perangkat ini. Berkas unduhan tetap tersimpan."
            right={
              <Button
                onClick={() => setIsClearDataDialogOpen(true)}
                variant="outline"
                className="w-full sm:w-auto shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/40 rounded-xl font-bold text-xs h-9 px-3.5 transition-colors"
              >
                Hapus data
              </Button>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          {/* Action 5: Shared Device Cleanup */}
          <SettingsItem
            icon={<IconWrapper variant="danger"><DeviceMobile size={19} weight="regular" /></IconWrapper>}
            title="Bersihkan untuk perangkat bersama"
            description="Keluar dari akun dan hapus seluruh data baca lokal, unduhan, dan cache pada perangkat ini."
            right={
              <Button
                onClick={() => setIsSharedDeviceDialogOpen(true)}
                variant="outline"
                disabled={isClearingDevice}
                className="w-full sm:w-auto shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/40 rounded-xl font-bold text-xs h-9 px-3.5 transition-colors"
              >
                {isClearingDevice ? "Membersihkan…" : "Bersihkan perangkat"}
              </Button>
            }
          />
        </SettingsSection>
      </div>

      {/* Footer Utility Actions */}
      <div className="xl:col-span-2 flex flex-col items-center gap-3 pt-2 pb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            useOnboardingStore.getState().resetOnboarding();
            toast.info("Panduan aplikasi disiapkan", {
              description: "Panduan onboarding akan ditampilkan saat kamu kembali ke Beranda.",
            });
          }}
          className="rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary h-9 px-4"
        >
          <Compass size={16} weight="regular" className="mr-1.5" />
          Buka Panduan Onboarding
        </Button>

        <span className="text-xs text-text-muted font-medium select-none">
          Yomirra v{packageInfo.version}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <YomirraSurface variant="base" className="min-h-screen">
        <PageContainer variant="management" hasMobileHeader>
          <div className="space-y-6 sm:space-y-8" data-hydrated={mounted}>
            {subView === "backup" ? (
              <>
                <PageHeader
                  title="Cadangan data"
                  subtitle="Ekspor atau pulihkan riwayat baca, bookmark, dan koleksi lokal."
                  icon={<FileText size={24} weight="regular" />}
                  actions={
                    <Button
                      variant="secondary"
                      onClick={() => setSubView("main")}
                      className="rounded-xl font-bold text-xs"
                    >
                      <CaretLeft size={16} weight="regular" className="mr-1" />
                      Kembali ke pengaturan
                    </Button>
                  }
                  desktopActions={
                    <Button
                      variant="secondary"
                      onClick={() => setSubView("main")}
                      className="rounded-xl font-bold text-xs"
                    >
                      <CaretLeft size={16} weight="regular" className="mr-1" />
                      Kembali ke pengaturan
                    </Button>
                  }
                />
                <ContentLane variant="focused" className="flex flex-col gap-4">
                  <BackupRestoreView onBack={() => setSubView("main")} />
                </ContentLane>
              </>
            ) : (
              <>
                <PageHeader
                  title="Pengaturan"
                  subtitle="Atur akun, tampilan, bacaan, dan penyimpanan Yomirra."
                  icon={<Gear size={24} weight="regular" />}
                />
                <ContentLane variant="management">
                  {settingsContent}
                </ContentLane>
              </>
            )}
          </div>
        </PageContainer>
      </YomirraSurface>

      {/* Confirmation Dialogs */}
      <ConfirmationModal
        isOpen={isClearDownloadsDialogOpen}
        onOpenChange={setIsClearDownloadsDialogOpen}
        title="Hapus semua unduhan bab offline?"
        description="Semua bab komik yang tersimpan untuk dibaca secara offline akan dihapus dari perangkat ini. Kamu tetap dapat membacanya kembali secara online."
        confirmLabel={isClearingDownloads ? "Menghapus…" : "Hapus semua unduhan"}
        cancelLabel="Batal"
        variant="danger"
        requireCheckbox="Saya mengerti bab offline akan dihapus"
        onConfirm={confirmClearDownloads}
      />

      <ConfirmationModal
        isOpen={isClearDataDialogOpen}
        onOpenChange={setIsClearDataDialogOpen}
        title="Hapus riwayat & bookmark lokal?"
        description={
          user
            ? "Riwayat baca dan bookmark lokal akan dihapus dari browser ini. Unduhan tetap tersimpan, dan data cloud dapat muncul lagi setelah sinkronisasi."
            : "Riwayat baca dan bookmark lokal akan dihapus. Unduhan tetap tersimpan."
        }
        confirmLabel="Hapus data lokal"
        cancelLabel="Batal"
        variant="danger"
        requireCheckbox="Saya mengerti riwayat baca dan bookmark lokal akan dihapus"
        onConfirm={confirmClearData}
      />

      <ConfirmationModal
        isOpen={isSharedDeviceDialogOpen}
        onOpenChange={setIsSharedDeviceDialogOpen}
        title="Bersihkan semua data perangkat?"
        description="Akun akan dikeluarkan dan seluruh data baca lokal, koleksi, unduhan, serta cache Yomirra pada perangkat ini akan dihapus. Data cloud tetap ada."
        confirmLabel={isClearingDevice ? "Membersihkan…" : "Bersihkan perangkat"}
        cancelLabel="Batal"
        variant="danger"
        requireCheckbox="Saya mengerti semua data Yomirra di perangkat ini akan dihapus"
        onConfirm={confirmSharedDeviceCleanup}
      />
    </>
  );
}
