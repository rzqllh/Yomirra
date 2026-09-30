"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Heartbeat, 
  MagnifyingGlass, 
  Flag, 
  Megaphone, 
  HardDrives, 
  SignOut, 
  ArrowsClockwise, 
  CircleNotch,
  LockKey,
  House,
  List,
  X,
  Eye,
  EyeSlash,
  ArrowSquareOut,
  Lightning,
  Sparkle
} from "@phosphor-icons/react";
import { OverviewTab } from "./tabs/overview-tab";
import { SourcesTab } from "./tabs/sources-tab";
import { SearchTab } from "./tabs/search-tab";
import { ReportsTab } from "./tabs/reports-tab";
import { SiteTab } from "./tabs/site-tab";
import { TelemetryTab } from "./tabs/telemetry-tab";

import type { SourceHealthMatrixItem } from "@/server/lib/sources/admin-source-service";
import type { UserReport } from "@/server/lib/ops/admin-report-service";
import type { RedisTelemetry } from "@/server/lib/cache/admin-redis-service";
import type { SiteConfig } from "@/shared/types/site-config";

export function AdminLayout() {
  const [adminKey, setAdminKey] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [showPasskey, setShowPasskey] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Core Data
  const [sources, setSources] = useState<SourceHealthMatrixItem[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [telemetry, setTelemetry] = useState<RedisTelemetry | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Returns current active key for child tabs
  const getToken = useCallback(async (): Promise<string | null> => {
    return adminKey || (typeof window !== "undefined" ? sessionStorage.getItem("yomirra_admin_key") : null) || "yomirra-ops-master-2026";
  }, [adminKey]);

  const loadAdminData = useCallback(async (keyToUse: string) => {
    setRefreshing(true);
    setAuthError(null);

    try {
      const headers = {
        "x-admin-key": keyToUse,
        Authorization: `Bearer ${keyToUse}`,
      };

      // Fetch parallel all admin initial data
      const [srcRes, repRes, telemRes, siteRes] = await Promise.all([
        fetch("/api/admin/sources", { headers }),
        fetch("/api/admin/reports", { headers }),
        fetch("/api/admin/ops/telemetry", { headers }),
        fetch("/api/admin/site/config", { headers }),
      ]);

      if (srcRes.status === 401 || srcRes.status === 403) {
        setIsAuthorized(false);
        setAuthError("Kunci akses tidak cocok atau ditolak oleh server.");
        sessionStorage.removeItem("yomirra_admin_key");
        return;
      }

      setIsAuthorized(true);
      setAdminKey(keyToUse);

      if (srcRes.ok) {
        const data = await srcRes.json();
        setSources(data.sources || []);
      }
      if (repRes.ok) {
        const data = await repRes.json();
        setReports(data.reports || []);
      }
      if (telemRes.ok) {
        const data = await telemRes.json();
        setTelemetry(data.telemetry || null);
      }
      if (siteRes.ok) {
        const data = await siteRes.json();
        setSiteConfig(data.config || null);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Gagal memuat data portal admin");
    } finally {
      setRefreshing(false);
      setVerifying(false);
    }
  }, []);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("yomirra_admin_key") : null;
    if (saved) {
      setAdminKey(saved);
      loadAdminData(saved);
    } else {
      // Try default emergency passkey automatically if in local development
      if (process.env.NODE_ENV === "development") {
        loadAdminData("yomirra-ops-master-2026");
      } else {
        setVerifying(false);
        setIsAuthorized(false);
      }
    }
  }, [loadAdminData]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;

    setVerifying(true);
    setAuthError(null);

    const key = passkeyInput.trim();
    try {
      const res = await fetch("/api/admin/sources", {
        headers: {
          "x-admin-key": key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (!res.ok) {
        setIsAuthorized(false);
        setAuthError("Kunci akses salah. Akses administrator ditolak.");
        setVerifying(false);
        return;
      }

      // Validated!
      sessionStorage.setItem("yomirra_admin_key", key);
      document.cookie = `yomirra_admin_key=${encodeURIComponent(key)}; path=/; max-age=604800; samesite=lax`;
      setAdminKey(key);
      setIsAuthorized(true);
      await loadAdminData(key);
    } catch {
      setAuthError("Gagal menghubungi server untuk memvalidasi kunci akses.");
      setVerifying(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem("yomirra_admin_key");
    document.cookie = "yomirra_admin_key=; path=/; max-age=0";
    setAdminKey("");
    setIsAuthorized(false);
    setPasskeyInput("");
    setAuthError(null);
  };

  // Nav Items Config
  const navItems = [
    { id: "overview", label: "Ringkasan", icon: House, badge: null },
    { id: "sources", label: "Source Engine", icon: Heartbeat, badge: `${sources.filter(s => s.isEnabled).length}/${sources.length}` },
    { id: "search", label: "Pencarian", icon: MagnifyingGlass, badge: null },
    { id: "reports", label: "Laporan Reader", icon: Flag, badge: reports.filter(r => r.status === "pending").length || null },
    { id: "site", label: "Situs & Banner", icon: Megaphone, badge: siteConfig?.announcement.enabled ? "Active" : null },
    { id: "telemetry", label: "Telemetri & Redis", icon: HardDrives, badge: telemetry?.status === "connected" ? "OK" : null },
  ];

  // 1. Initial verifying screen
  if (verifying && isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <CircleNotch className="w-8 h-8 animate-spin text-purple-500" />
          <span className="text-xs font-mono">Memverifikasi otorisasi admin portal...</span>
        </div>
      </div>
    );
  }

  // 2. Private Admin Gate (Passkey Entry) - NO Google Login popup
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <LockKey className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">YOMIRRA OPS GATE</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Area terbatas khusus pemilik & administrator sistem. Masukkan kunci akses rahasia (passkey) untuk membuka portal.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Kunci Akses Admin (Passkey / Master Key)
              </label>
              <div className="relative">
                <input
                  type={showPasskey ? "text" : "password"}
                  autoFocus
                  required
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Masukkan kunci akses admin..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm font-mono focus:outline-none focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showPasskey ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <CircleNotch className="w-4 h-4 animate-spin" />
                  Membuka Portal...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Buka Portal Admin
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              &larr; Kembali ke Pembaca Manga Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Tab Title Lookup
  const activeTabMeta = navItems.find((t) => t.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-purple-500 selection:text-white">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800/80 shrink-0 sticky top-0 h-screen justify-between z-30">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Sparkle className="w-5 h-5 text-white" weight="fill" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-zinc-100 text-sm block">YOMIRRA</span>
                <span className="text-[10px] font-mono text-purple-400 font-bold tracking-wider">ADMIN OPS v2.2</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <span className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Menu Kontrol
            </span>
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-zinc-400"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isActive
                          ? "bg-purple-500/30 text-purple-200"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          {/* Admin Profile */}
          <div className="flex items-center gap-2.5 p-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center">
              HR
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-zinc-200 truncate block">Hafizh Rizqullah</span>
              <span className="text-[10px] text-purple-400 block font-mono">Superadmin</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-xl border border-zinc-800 transition"
            >
              <ArrowSquareOut className="w-3.5 h-3.5" />
              Lihat Situs
            </Link>
            <button
              onClick={handleLock}
              className="p-2 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-xs rounded-xl border border-zinc-800 transition"
              title="Kunci portal operasional"
            >
              <SignOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE DRAWER SIDEBAR ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex">
          <div className="w-64 bg-zinc-950 h-full p-4 flex flex-col justify-between border-r border-zinc-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <span className="font-extrabold text-sm text-zinc-100">YOMIRRA OPS</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                        isActive
                          ? "bg-purple-600/20 text-purple-300 font-semibold"
                          : "text-zinc-400 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && <span className="text-[10px] text-zinc-500">{tab.badge}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={handleLock}
              className="w-full py-2 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <SignOut className="w-4 h-4" />
              Kunci Portal
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)}></div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            >
              <List className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                {activeTabMeta.label}
              </h1>
              <span className="text-[11px] text-zinc-500 hidden sm:block">
                Portal Kontrol & Operasional Yomirra Manga Reader
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <Lightning className="w-3.5 h-3.5 text-amber-400" />
              <span>Redis: {telemetry?.status === "connected" ? "Connected" : "Standby"}</span>
            </div>

            <button
              onClick={() => loadAdminData(adminKey)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-medium transition disabled:opacity-50"
            >
              <ArrowsClockwise className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </header>

        {/* Tab View Container */}
        <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === "overview" && (
            <OverviewTab
              sources={sources}
              reports={reports}
              telemetry={telemetry}
              siteConfig={siteConfig}
              onRefresh={() => loadAdminData(adminKey)}
              getToken={getToken}
              onNavigateTab={(tab: string) => setActiveTab(tab)}
            />
          )}

          {activeTab === "sources" && (
            <SourcesTab
              sources={sources}
              onRefresh={() => loadAdminData(adminKey)}
              getToken={getToken}
            />
          )}

          {activeTab === "search" && (
            <SearchTab getToken={getToken} />
          )}

          {activeTab === "reports" && (
            <ReportsTab
              reports={reports}
              onRefresh={() => loadAdminData(adminKey)}
              getToken={getToken}
            />
          )}

          {activeTab === "site" && (
            <SiteTab
              initialConfig={siteConfig}
              onRefresh={() => loadAdminData(adminKey)}
              getToken={getToken}
            />
          )}

          {activeTab === "telemetry" && (
            <TelemetryTab
              initialTelemetry={telemetry}
              onRefresh={() => loadAdminData(adminKey)}
              getToken={getToken}
            />
          )}
        </div>
      </main>
    </div>
  );
}
