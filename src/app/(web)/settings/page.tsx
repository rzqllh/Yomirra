"use client";

import * as React from "react";
import { UserCircle, SignOut, Broom, Palette, HandTap, ShieldWarning, WifiHigh, Lightning, Fire, PuzzlePiece, Spinner, ArrowsClockwise } from "@phosphor-icons/react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useSync } from "@/shared/hooks/use-sync";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useTheme } from "next-themes";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { YomirraSurface } from "@/components/ui/layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Gear } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettingsSection, SettingsItem, IconWrapper } from "./components/settings-ui";

export default function SettingsPage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const { runFullSync, isSyncing } = useSync({ autoSync: false });
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearLibrary = useLibraryStore((state) => state.clearLibrary);
  const { dataSaver, setDataSaver, hideNsfw, setHideNsfw, lastSyncedAt } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const { isGodMode, toggleGodMode } = useSettingsStore();

  React.useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = React.useState(false);

  const handleClearData = () => {
    setIsClearDataDialogOpen(true);
  };

  const confirmClearData = () => {
    clearHistory();
    clearLibrary();
    toast.success("Data lokal berhasil dibersihkan");
    setIsClearDataDialogOpen(false);
  };

  const formatLastSynced = () => {
    if (!lastSyncedAt) return "Belum pernah disinkronisasi";
    try {
      return `Terakhir sinkronisasi: ${format(new Date(lastSyncedAt), "d MMM yyyy, HH:mm", { locale: idLocale })}`;
    } catch {
      return "Terakhir sinkronisasi: -";
    }
  };

  React.useEffect(() => {
    if (clickCount > 0 && clickCount < 7) {
      const timer = setTimeout(() => setClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleVersionClick = () => {
    if (!user) return; // Only allow if logged in
    
    if (clickCount + 1 >= 7) {
      toggleGodMode();
      toast.success(!isGodMode ? "God Mode Diaktifkan" : "God Mode Dinonaktifkan");
      setClickCount(0);
    } else {
      setClickCount((prev) => prev + 1);
    }
  };

  return (
    <DirectionalTransition>
      <div className="flex flex-col min-h-screen">
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
          <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-6 md:px-8 md:py-8 space-y-8">
            
            <DesktopPageTitle 
              title="Pengaturan" 
              description="Sesuaikan preferensi aplikasi sesuai keinginanmu."
              icon={<Gear size={32} weight="duotone" />}
            />

            {/* Akun & Sinkronisasi */}
            <SettingsSection title="Akun & Sinkronisasi">
              {user ? (
                <div className="flex flex-col">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 p-3 border-b border-border-subtle/50 mb-2">
                    <div className="relative shrink-0">
                      {user.photoURL ? (
                        <Image 
                          src={user.photoURL} 
                          alt={user.displayName || "User"} 
                          width={60} 
                          height={60} 
                          className="rounded-full border-2 border-surface-base shadow-sm object-cover" 
                          referrerPolicy="no-referrer" 
                          unoptimized 
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-full bg-accent/10 text-accent flex items-center justify-center border-2 border-surface-base shadow-sm">
                          <UserCircle size={32} weight="duotone" />
                        </div>
                      )}
                      <div className="absolute border-bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-overlay flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-semantic-success shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-text-primary truncate leading-tight">
                        {user.displayName}
                      </h3>
                      <p className="text-sm text-text-secondary truncate mt-0.5">
                        {user.email}
                      </p>
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-semantic-success/10 border border-semantic-success/20">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-semantic-success">
                          Sync Aktif
                        </span>
                      </div>
                    </div>
                  </div>

                  <SettingsItem
                    icon={
                      <IconWrapper>
                        {isSyncing ? <Spinner size={20} className="animate-spin" /> : <ArrowsClockwise size={20} weight="duotone" />}
                      </IconWrapper>
                    }
                    title="Sinkronisasi Sekarang"
                    description={formatLastSynced()}
                    onClick={runFullSync}
                    disabled={isSyncing}
                  />

                  <SettingsItem
                    icon={
                      <IconWrapper variant="danger">
                        <SignOut size={20} weight="duotone" />
                      </IconWrapper>
                    }
                    title="Keluar dari Akun"
                    description="Hapus akses sesi saat ini"
                    onClick={handleLogout}
                    danger
                  />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Login untuk Sinkronisasi</h3>
                    <p className="text-sm text-text-secondary mt-1 max-w-md">Masuk dengan Google untuk mengaktifkan sinkronisasi otomatis History dan Readlist lintas perangkat.</p>
                  </div>
                  <Button onClick={loginWithGoogle} variant="accent" className="w-full sm:w-auto rounded-full font-bold shadow-sm">
                    <UserCircle size={20} className="mr-2" weight="duotone" />
                    Masuk dengan Google
                  </Button>
                </div>
              )}
            </SettingsSection>

            {/* Pintasan Navigasi */}
            <SettingsSection title="Pintasan Navigasi">
              <Link href="/updates" className="block outline-none" prefetch={false}>
                <SettingsItem
                  icon={<IconWrapper variant="accent"><Lightning size={20} weight="duotone" /></IconWrapper>}
                  title="Update Terbaru"
                  description="Chapter rilis terbaru dari sumber aktif."
                  onClick={() => {}} // Pass empty function to enable interactive styling + caret
                />
              </Link>
              
              <Link href="/popular" className="block outline-none" prefetch={false}>
                <SettingsItem
                  icon={<IconWrapper variant="accent"><Fire size={20} weight="duotone" /></IconWrapper>}
                  title="Manga Populer"
                  description="Judul paling banyak dibaca saat ini."
                  onClick={() => {}}
                />
              </Link>
              
              <Link href="/sources" className="block outline-none" prefetch={false}>
                <SettingsItem
                  icon={<IconWrapper variant="accent"><PuzzlePiece size={20} weight="duotone" /></IconWrapper>}
                  title="Kelola Sumber"
                  description="Pilih atau ubah sumber ekstensi manga."
                  onClick={() => {}}
                />
              </Link>
            </SettingsSection>

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
                icon={<IconWrapper><HandTap size={20} weight="duotone" /></IconWrapper>}
                title="Perilaku Tap Layar"
                description="Navigasi dengan sentuhan tepi."
                right={<Button variant="outline" size="sm" className="text-xs h-8 shrink-0 rounded-full font-bold">Ubah</Button>}
              />
              
              <div className="mx-3 my-1 border-b border-border-subtle/50" />

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

            {/* Data Lokal */}
            <SettingsSection title={user ? "Data Perangkat" : "Data Lokal"}>
              <SettingsItem
                icon={<IconWrapper variant="danger"><Broom size={20} weight="duotone" /></IconWrapper>}
                title={user ? "Bersihkan Cache Perangkat" : "Hapus Data Lokal"}
                description={user ? "Menghapus data lokal di perangkat ini (tidak menghapus cloud)." : "Menghapus akan mereset riwayat & readlist secara permanen."}
                right={
                  <Button onClick={handleClearData} variant="outline" className="w-full sm:w-auto shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/50 rounded-full font-bold transition-colors">
                    Bersihkan
                  </Button>
                }
              />
            </SettingsSection>

            {/* Version Trigger */}
            <div className="flex justify-center pt-4 pb-2 md:pb-4">
              <button 
                onClick={handleVersionClick}
                className="text-xs text-text-muted font-medium hover:text-text-secondary transition-colors select-none"
              >
                Yomirra v1.0.0
              </button>
            </div>

          </div>
        </YomirraSurface>
      </div>

      <Dialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          <DialogHeader>
            <DialogTitle>Bersihkan Data Perangkat?</DialogTitle>
            <DialogDescription>
              {user ? "Ini akan menghapus riwayat dan koleksi di perangkat ini. Datamu di cloud akan tetap aman dan akan dimuat ulang saat sinkronisasi." : "Semua riwayat bacaan dan koleksi akan dihapus permanen karena kamu tidak login."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsClearDataDialogOpen(false)}
              className="flex-1 rounded-full font-bold h-12"
            >
              Nanti Aja
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearData}
              className="flex-1 rounded-full font-bold h-12"
            >
              Bersihkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DirectionalTransition>
  );
}
