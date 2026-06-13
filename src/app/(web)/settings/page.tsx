"use client";

import * as React from "react";
import { UserCircle, SignOut, Trash, Monitor, HandSwipeLeft, EyeSlash, WifiHigh, Compass, CaretRight, HardDrives, Spinner, ArrowsClockwise } from "@phosphor-icons/react";
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
import { YomirraSurface } from "@/components/ui/yomirra-layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/yomirra-header";
import { YomirraSegmentedControl } from "@/components/ui/yomirra-segmented-control";
import { Gear } from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function SettingsPage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const { runFullSync, isSyncing } = useSync({ autoSync: false });
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearLibrary = useLibraryStore((state) => state.clearLibrary);
  const { dataSaver, setDataSaver, hideNsfw, setHideNsfw, lastSyncedAt } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleClearData = () => {
    if (confirm("Yakin ingin menghapus semua Riwayat dan Readlist lokal?" + (user ? " (Data di Cloud mungkin tidak terhapus)" : ""))) {
      clearHistory();
      clearLibrary();
      alert("Data lokal berhasil dibersihkan.");
    }
  };

  const formatLastSynced = () => {
    if (!lastSyncedAt) return "Belum pernah disinkronisasi";
    try {
      return `Terakhir sinkronisasi: ${format(new Date(lastSyncedAt), "d MMM yyyy, HH:mm", { locale: idLocale })}`;
    } catch {
      return "Terakhir sinkronisasi: -";
    }
  };

  return (
    <DirectionalTransition>
      <div className="flex flex-col min-h-screen">
        <div className="md:hidden">
          <YomirraPageHeader title="Pengaturan" variant="auto" />
        </div>

        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
          <div className="px-4 py-6 md:px-8 md:py-8 space-y-8">
            
            <div className="hidden md:block">
              <DesktopPageTitle 
                title="Pengaturan" 
                description="Sesuaikan preferensi aplikasi sesuai keinginanmu."
                icon={<Gear size={32} weight="duotone" />}
              />
            </div>

            {/* Akun & Sinkronisasi */}
            <section className="bg-surface-overlay border border-border-subtle rounded-xl p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Akun & Sinkronisasi</h2>
              
              {user ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt={user.displayName || "User"} width={64} height={64} className="rounded-full border border-border-subtle object-cover" referrerPolicy="no-referrer" unoptimized />
                  ) : (
                    <UserCircle size={64} weight="duotone" className="text-accent" />
                  )}
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-text-primary">{user.displayName}</h3>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
                      <p className="text-xs text-text-muted font-medium">Sinkronisasi aktif</p>
                      <span className="text-xs text-text-muted opacity-50">•</span>
                      <p className="text-xs text-text-muted font-medium">{formatLastSynced()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                    <Button 
                      onClick={runFullSync} 
                      disabled={isSyncing}
                      variant="outline" 
                      className="w-full sm:w-auto text-text-secondary hover:text-text-primary rounded-full font-bold transition-colors"
                    >
                      {isSyncing ? (
                        <Spinner size={18} className="mr-2 animate-spin" />
                      ) : (
                        <ArrowsClockwise size={18} className="mr-2" />
                      )}
                      Sinkronisasi
                    </Button>
                    <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/50 rounded-full font-bold transition-colors">
                      <SignOut size={18} className="mr-2" />
                      Keluar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
            </section>

            {/* Pintasan Navigasi */}
            <section className="bg-surface-overlay border border-border-subtle rounded-xl p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Pintasan Navigasi</h2>
              
              <div className="flex flex-col gap-1">
                <Link href="/updates" transitionTypes={['nav-forward']} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Compass size={18} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">Update Terbaru</h3>
                      <p className="text-xs text-text-secondary mt-0.5">Chapter rilis terbaru dari sumber aktif.</p>
                    </div>
                  </div>
                  <CaretRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                </Link>

                <Link href="/popular" transitionTypes={['nav-forward']} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Compass size={18} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">Manga Populer</h3>
                      <p className="text-xs text-text-secondary mt-0.5">Judul paling banyak dibaca saat ini.</p>
                    </div>
                  </div>
                  <CaretRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                </Link>

                <Link href="/sources" transitionTypes={['nav-forward']} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <HardDrives size={18} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">Kelola Sumber</h3>
                      <p className="text-xs text-text-secondary mt-0.5">Pilih atau ubah sumber ekstensi manga.</p>
                    </div>
                  </div>
                  <CaretRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                </Link>
              </div>
            </section>

            {/* Preferensi Tampilan */}
            <section className="bg-surface-overlay border border-border-subtle rounded-xl p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Preferensi Tampilan</h2>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b border-border-subtle mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted border border-border-subtle text-text-primary">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Tema Aplikasi</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Pilih tema terang atau gelap.</p>
                  </div>
                </div>
                <div className="flex w-full sm:w-auto">
                  {mounted ? (
                    <YomirraSegmentedControl
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
                    <YomirraSegmentedControl
                      layoutId="theme-toggle"
                      options={[
                        { value: "light", label: "Terang" },
                        { value: "dark", label: "Gelap" },
                        { value: "system", label: "Sistem" },
                      ]}
                      value="system"
                      onChange={() => {}}
                      className="w-full sm:w-auto opacity-50"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border-subtle mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted border border-border-subtle text-text-primary">
                    <HandSwipeLeft size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Perilaku Tap Layar</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Navigasi dengan sentuhan tepi.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8 shrink-0 rounded-full font-bold">Ubah</Button>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted border border-border-subtle text-text-primary">
                    <WifiHigh size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Penghemat Data</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Muat gambar resolusi rendah.</p>
                  </div>
                </div>
                <ToggleSwitch 
                  id="data-saver" 
                  checked={mounted ? dataSaver : false}
                  onCheckedChange={setDataSaver}
                  label="Penghemat Data"
                />
              </div>
            </section>

            {/* Konten & Keamanan */}
            <section className="bg-surface-overlay border border-border-subtle rounded-xl p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Konten & Keamanan</h2>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted border border-border-subtle text-text-primary">
                    <EyeSlash size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Sembunyikan NSFW</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Saring konten dewasa di sumber.</p>
                  </div>
                </div>
                <ToggleSwitch 
                  id="nsfw-toggle" 
                  checked={mounted ? hideNsfw : true}
                  onCheckedChange={setHideNsfw}
                  label="Sembunyikan NSFW"
                />
              </div>
            </section>

            {/* Data Lokal */}
            <section className="bg-surface-overlay border border-border-subtle rounded-xl p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                {user ? "Data Perangkat" : "Data Lokal"}
              </h2>
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {user ? "Bersihkan Cache Perangkat" : "Hapus Data Lokal"}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-md">
                    {user 
                      ? "Menghapus data lokal di perangkat ini. (Tidak akan menghapus data yang tersinkronisasi di cloud)" 
                      : "Menghapus akan mereset riwayat dan readlist secara permanen."}
                  </p>
                </div>
                
                <Button onClick={handleClearData} variant="outline" className="shrink-0 text-semantic-error hover:text-white hover:bg-semantic-error border-semantic-error/50 rounded-full font-bold transition-colors">
                  <Trash size={18} className="mr-2" />
                  Bersihkan
                </Button>
              </div>
            </section>

          </div>
        </YomirraSurface>
      </div>
    </DirectionalTransition>
  );
}
