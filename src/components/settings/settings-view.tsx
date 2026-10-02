"use client";

import * as React from "react";
import { UserCircle, Broom, Palette, WifiHigh, Fire, ArrowsClockwise, DeviceMobile, FileText, Clock, Bell, X, Compass, Globe, Trash, CaretLeft } from "@phosphor-icons/react";
import { BackupRestoreView } from "@/components/settings/backup-restore-modal";
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
import { YomirraSurface, PageContainer, ContentLane } from "@/components/ui/layout";
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
import { clearSharedDeviceData } from "@/shared/lib/local-data-cleanup";

export interface SettingsViewProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function SettingsView({ isOverlay = false, onClose }: SettingsViewProps) {
  const { user, logout } = useAuth();
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearLibrary = useLibraryStore((state) => state.clearLibrary);
  const {
    dataSaver, setDataSaver, hideNsfw, setHideNsfw, lastSyncedAt, keepScreenAwake, setKeepScreenAwake,
    checkOnAppStart, setCheckOnAppStart, minimumCheckIntervalMinutes, setMinimumCheckIntervalMinutes,
    notifyForAllLibraryItems, setNotifyForAllLibraryItems,
    routingMode, setRoutingMode, preferredLanguages, setPreferredLanguages
  } = useSettingsStore();
  const totalReadingTimeMs = useStatsStore((state) => state.totalReadingTimeMs);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const [subView, setSubView] = React.useState<"main" | "backup">("main");
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = React.useState(false);
  const [isSharedDeviceDialogOpen, setIsSharedDeviceDialogOpen] = React.useState(false);
  const [isClearingCache, setIsClearingCache] = React.useState(false);
  const [isClearingDevice, setIsClearingDevice] = React.useState(false);
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
      toast.success("Cache bacaan dibersihkan", {
        description: "Berkas bacaan sementara berhasil dihapus untuk melegakan perangkat.",
      });
      const est = await getStorageEstimate();
      if (est) {
        setStorageUsage(`${est.usageMB} MB / ${est.quotaMB} MB`);
      }
    } catch {
      toast.error("Cache gagal dibersihkan", {
        description: "Penyimpanan sementara tidak dapat dibersihkan saat ini. Coba sesaat lagi.",
      });
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
    toast.info("Riwayat & bookmark lokal dihapus", {
      description: "Unduhan dan cache bacaan tetap tersimpan di perangkat ini.",
    });
    setIsClearDataDialogOpen(false);
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
        description: "Akun, data baca lokal, unduhan, dan cache perangkat telah dibersihkan.",
      });
      window.location.replace("/");
    } catch {
      toast.error("Data perangkat gagal dibersihkan", {
        description: "Sebagian data mungkin masih tersimpan. Coba lagi sebelum menyerahkan perangkat.",
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
    <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
      <div className="flex min-w-0 flex-col gap-6">
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
                    Kelola akun & sinkronisasi
                  </span>
                  <span>&rarr;</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Masuk untuk sinkronisasi</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-md">Masuk dengan Google untuk menyinkronkan bookmark, riwayat baca, dan koleksi lintas perangkat.</p>
              </div>
              <Link href="/account" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto rounded-xl font-bold shadow-xs text-xs">
                  <UserCircle size={18} className="mr-1.5" weight="bold" />
                  Buka akun
                </Button>
              </Link>
            </div>
          )}
        </SettingsSection>

        {/* Statistik Membaca */}
        <SettingsSection title="Statistik membaca">
          <SettingsItem
            icon={<IconWrapper variant="accent"><Fire size={20} weight="duotone" /></IconWrapper>}
            title="Waktu membaca"
            description="Total waktu yang tercatat saat membaca di Yomirra."
            right={<div className="text-sm font-semibold text-text-primary">{formatReadingTime()}</div>}
          />
        </SettingsSection>

        {/* Pembaruan Library */}
        <SettingsSection title="Pembaruan Library">
          <SettingsItem
            icon={<IconWrapper><ArrowsClockwise size={20} weight="duotone" /></IconWrapper>}
            title="Cek otomatis saat dibuka"
            description="Periksa chapter baru secara otomatis saat aplikasi dimulai."
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
            icon={<IconWrapper><Clock size={20} weight="duotone" /></IconWrapper>}
            title="Jeda pengecekan"
            description="Jeda sebelum pengecekan otomatis berikutnya."
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
            title="Tandai pembaruan baru"
            description="Tampilkan jumlah pembaruan yang belum dilihat pada navigasi."
            right={
              <ToggleSwitch
                id="notify-all"
                checked={mounted ? notifyForAllLibraryItems : true}
                onCheckedChange={setNotifyForAllLibraryItems}
                label="Tandai pembaruan baru"
              />
            }
          />
        </SettingsSection>

        {/* Preferensi Sumber & Bahasa */}
        <SettingsSection title="Sumber & bahasa">
          <SettingsItem
            icon={<IconWrapper><Compass size={20} weight="duotone" /></IconWrapper>}
            title="Saat sumber bermasalah"
            description="Pilih tindakan saat sumber lambat atau gagal dimuat."
            right={
              <CustomSelect
                value={mounted ? routingMode : "PREFERRED"}
                onChange={(val) => setRoutingMode(val as SourceRoutingMode)}
                options={[
                  { value: "PREFERRED", label: "Tetap gunakan pilihan saya" },
                  { value: "AUTO_SAFE", label: "Cari sumber lain otomatis" },
                  { value: "MANUAL", label: "Tanyakan terlebih dahulu" },
                ]}
              />
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper><Globe size={20} weight="duotone" /></IconWrapper>}
            title="Bahasa utama"
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
        </SettingsSection>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        {/* Preferensi Tampilan */}
        <SettingsSection title="Tampilan">
          <SettingsItem
            className="md:hidden"
            wrapOnMobile
            icon={<IconWrapper><Palette size={20} weight="duotone" /></IconWrapper>}
            title="Tema"
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
                  onChange={() => { }}
                  className="w-full sm:w-auto opacity-50"
                />
              )
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50 md:hidden" />

          <SettingsItem
            icon={<IconWrapper><WifiHigh size={20} weight="duotone" /></IconWrapper>}
            title="Hemat data"
            description="Muat gambar resolusi rendah."
            right={
              <ToggleSwitch
                id="data-saver"
                checked={mounted ? dataSaver : false}
                onCheckedChange={setDataSaver}
                label="Hemat data"
              />
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50 lg:hidden" />

          <SettingsItem
            className="lg:hidden"
            icon={<IconWrapper><DeviceMobile size={20} weight="duotone" /></IconWrapper>}
            title="Jaga layar tetap menyala"
            description="Cegah layar mati otomatis selama unduhan berlangsung."
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

        {/* Konten & Keamanan */}
        <SettingsSection title="Konten">
          <SettingsItem
            icon={<IconWrapper><ShieldWarning size={20} weight="duotone" /></IconWrapper>}
            title="Sembunyikan konten dewasa"
            description="Sembunyikan sumber dan konten yang ditandai 18+."
            right={
              <ToggleSwitch
                id="nsfw-toggle"
                checked={mounted ? hideNsfw : true}
                onCheckedChange={setHideNsfw}
                label="Sembunyikan konten dewasa"
              />
            }
          />
        </SettingsSection>

        {/* Backup & Restore */}
        <SettingsSection title="Cadangan data">
          <SettingsItem
            icon={<IconWrapper variant="accent"><FileText size={20} weight="duotone" /></IconWrapper>}
            title="Ekspor atau pulihkan data"
            description="Simpan salinan data komikmu ke berkas cadangan atau pulihkan riwayat dan koleksi kapan saja."
            right={
              <Button onClick={() => setSubView("backup")} variant="outline" className="w-full sm:w-auto shrink-0 border-accent/40 text-accent hover:bg-accent hover:text-white rounded-xl font-bold transition-colors">
                Kelola cadangan
              </Button>
            }
          />
        </SettingsSection>

        {/* Data & Penyimpanan */}
        <SettingsSection title={user ? "Penyimpanan & data perangkat" : "Penyimpanan & data lokal"}>
          <SettingsItem
            icon={<IconWrapper><Broom size={20} weight="duotone" /></IconWrapper>}
            title="Bersihkan cache bacaan"
            description={`Hapus gambar dan data sementara tanpa menghapus riwayat atau unduhan.${storageUsage ? ` (Terpakai: ${storageUsage})` : ""}`}
            right={
              <Button
                onClick={handleClearAutomaticCache}
                variant="outline"
                disabled={isClearingCache}
                className="w-full sm:w-auto shrink-0 rounded-xl font-bold transition-colors"
              >
                {isClearingCache ? "Membersihkan…" : "Bersihkan cache"}
              </Button>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper variant="danger"><Trash size={20} weight="duotone" /></IconWrapper>}
            title="Hapus riwayat & bookmark lokal"
            description={user ? "Hapus riwayat baca dan bookmark lokal di perangkat ini. Unduhan tetap tersimpan, dan data cloud dapat muncul lagi setelah sinkronisasi." : "Hapus riwayat baca dan bookmark lokal dari perangkat ini. Unduhan tetap tersimpan."}
            right={
              <Button onClick={handleClearData} variant="outline" className="w-full sm:w-auto shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/50 rounded-xl font-bold transition-colors">
                Hapus Data
              </Button>
            }
          />

          <div className="mx-3 my-1 border-b border-border-subtle/50" />

          <SettingsItem
            icon={<IconWrapper variant="danger"><DeviceMobile size={20} weight="duotone" /></IconWrapper>}
            title="Bersihkan untuk perangkat bersama"
            description="Keluar dari akun dan hapus data baca lokal, koleksi, unduhan, serta cache dari perangkat ini. Data cloud tidak dihapus."
            right={
              <Button
                onClick={() => setIsSharedDeviceDialogOpen(true)}
                variant="outline"
                disabled={isClearingDevice}
                className="w-full sm:w-auto shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/50 rounded-xl font-bold transition-colors"
              >
                {isClearingDevice ? "Membersihkan…" : "Bersihkan perangkat"}
              </Button>
            }
          />
        </SettingsSection>
      </div>

      <div className="xl:col-span-2">
        {/* Version */}
        <div className="flex justify-center pt-2 pb-2">
          <span className="text-xs text-text-muted font-medium select-none">
            Yomirra v2.1.0
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <YomirraSurface variant="base" className="min-h-screen">
        <PageContainer variant="management" hasMobileHeader>
          <h1 className="sr-only">{subView === "backup" ? "Cadangan data" : "Pengaturan Yomirra"}</h1>
          <div className="space-y-8">
            {subView === "backup" ? (
              <>
                <PageHeader
                  title="Cadangan data"
                  subtitle="Ekspor atau pulihkan riwayat baca, bookmark, dan koleksi lokal."
                  icon={<FileText size={24} weight="duotone" />}
                  actions={
                    <Button
                      variant="secondary"
                      onClick={() => setSubView("main")}
                      className="rounded-xl font-bold text-xs"
                    >
                      <CaretLeft size={16} weight="bold" className="mr-1" />
                      Kembali ke pengaturan
                    </Button>
                  }
                  hideDesktop
                />
                <ContentLane variant="focused" className="flex flex-col gap-4">
                  <div className="hidden md:flex">
                    <Button
                      variant="secondary"
                      onClick={() => setSubView("main")}
                      className="rounded-xl font-bold text-xs"
                    >
                      <CaretLeft size={16} weight="bold" className="mr-1" />
                      Kembali ke pengaturan
                    </Button>
                  </div>
                  <BackupRestoreView onBack={() => setSubView("main")} />
                </ContentLane>
              </>
            ) : (
              <>
                <PageHeader
                  title="Pengaturan"
                  subtitle="Atur tampilan, bacaan, dan data Yomirra."
                  icon={<Gear size={24} weight="duotone" />}
                  hideDesktop
                />
                <ContentLane variant="management">
                  {settingsContent}
                </ContentLane>
              </>
            )}
          </div>
        </PageContainer>
      </YomirraSurface>

      <ConfirmationModal
        isOpen={isClearDataDialogOpen}
        onOpenChange={setIsClearDataDialogOpen}
        title="Hapus riwayat & bookmark lokal?"
        description={
          user
            ? "Riwayat baca dan bookmark lokal akan dihapus. Unduhan tetap tersimpan, dan data cloud dapat muncul lagi setelah sinkronisasi."
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
