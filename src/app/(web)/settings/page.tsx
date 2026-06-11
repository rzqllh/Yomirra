"use client";

import * as React from "react";
import { UserCircle, SignOut, Trash, Monitor, BookOpenText, HandSwipeLeft, EyeSlash, WifiHigh } from "@phosphor-icons/react";
import { useAuth } from "@/shared/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useTheme } from "next-themes";
import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

export default function SettingsPage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const clearLibrary = useLibraryStore((state) => state.clearLibrary);
  const { dataSaver, setDataSaver, hideNsfw, setHideNsfw } = useSettingsStore();
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

  return (
    <MobilePageShell title="Pengaturan">
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 w-full max-w-3xl mx-auto pb-20 md:pb-8">
          <div className="px-4 py-6 md:px-8 md:py-8 space-y-8">
            
            <div className="hidden md:block">
              <h1 className="text-2xl font-black text-text-primary tracking-tight">Pengaturan</h1>
              <p className="text-text-muted mt-1">Kelola akun, sinkronisasi, dan preferensi aplikasi.</p>
            </div>

            {/* Akun & Sinkronisasi */}
            <section className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Akun & Sinkronisasi</h2>
              
              {user ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt={user.displayName || "User"} width={64} height={64} className="rounded-full border border-border-strong" />
                  ) : (
                    <UserCircle size={64} weight="duotone" className="text-accent" />
                  )}
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-text-primary">{user.displayName}</h3>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                    <p className="text-xs text-text-muted font-medium mt-1">Sinkronisasi cloud belum aktif sepenuhnya. Data lokal tetap disimpan di perangkat ini.</p>
                  </div>

                  <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto text-error hover:text-error hover:bg-error/10 border-error/50">
                    <SignOut size={18} className="mr-2" />
                    Keluar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Login untuk Sinkronisasi</h3>
                    <p className="text-sm text-text-secondary mt-1 max-w-md">Masuk dengan Google untuk mengaktifkan sinkronisasi otomatis History dan Readlist lintas perangkat.</p>
                  </div>
                  <Button onClick={loginWithGoogle} variant="accent" className="w-full sm:w-auto rounded-full font-bold">
                    <UserCircle size={20} className="mr-2" weight="duotone" />
                    Masuk dengan Google
                  </Button>
                </div>
              )}
            </section>

            {/* Preferensi Tampilan */}
            <section className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Preferensi Tampilan</h2>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b border-border-subtle/50 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay border border-border-subtle">
                    <Monitor size={20} className="text-text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Tema Aplikasi</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Pilih tema terang atau gelap.</p>
                  </div>
                </div>
                <div className="flex w-full sm:w-auto bg-surface-overlay rounded-lg border border-border-subtle overflow-hidden">
                  {mounted ? (
                    <>
                      <button onClick={() => setTheme("light")} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors ${theme === "light" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}>Terang</button>
                      <button onClick={() => setTheme("dark")} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle ${theme === "dark" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}>Gelap</button>
                      <button onClick={() => setTheme("system")} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle ${theme === "system" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}>Sistem</button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors text-text-secondary">Terang</button>
                      <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle text-text-secondary">Gelap</button>
                      <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle text-text-secondary">Sistem</button>
                    </>
                  )}
                </div>
              </div>



              <div className="flex items-center justify-between py-3 border-b border-border-subtle/50 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay border border-border-subtle">
                    <HandSwipeLeft size={20} className="text-text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Perilaku Tap Layar</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Navigasi dengan sentuhan tepi.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8 shrink-0">Ubah</Button>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-surface-overlay border border-border-subtle">
                    <WifiHigh size={20} className="text-text-primary" />
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
            <section className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Konten & Keamanan</h2>
              
              <div className="flex items-center justify-between py-2 border-b border-border-subtle/50 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-surface-overlay border border-border-subtle">
                    <EyeSlash size={20} className="text-text-primary" />
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
            <section className="bg-surface-raised border border-border-subtle rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">
                {user ? "Data Perangkat" : "Data Lokal"}
              </h2>
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {user ? "Bersihkan Cache Perangkat" : "Hapus Data Lokal"}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-md">
                    {user 
                      ? "Menghapus data lokal di perangkat ini. (Tidak akan menghapus data yang sudah tersinkronisasi di cloud jika ada)" 
                      : "Data disimpan lokal di perangkat ini. Menghapus akan mereset riwayat dan readlist secara permanen."}
                  </p>
                </div>
                
                <Button onClick={handleClearData} variant="outline" className="shrink-0 text-error hover:text-error hover:bg-error/10 border-error/50">
                  <Trash size={18} className="mr-2" />
                  Bersihkan
                </Button>
              </div>
            </section>

          </div>
        </main>
      </div>
    </MobilePageShell>
  );
}
