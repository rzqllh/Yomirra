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
  House
} from "@phosphor-icons/react";
import { useAuth } from "@/shared/hooks/use-auth";
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
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Core Data
  const [sources, setSources] = useState<SourceHealthMatrixItem[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [telemetry, setTelemetry] = useState<RedisTelemetry | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, [user]);

  const loadAdminData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setAuthError(null);

    try {
      const token = await getToken();
      if (!token) {
        setIsAuthorized(false);
        setAuthError("Token autentikasi tidak tersedia");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch parallel all admin initial data
      const [srcRes, repRes, telemRes, siteRes] = await Promise.all([
        fetch("/api/admin/sources", { headers }),
        fetch("/api/admin/reports", { headers }),
        fetch("/api/admin/ops/telemetry", { headers }),
        fetch("/api/admin/site/config", { headers }),
      ]);

      if (srcRes.status === 401 || srcRes.status === 403) {
        setIsAuthorized(false);
        setAuthError(
          `Akun ${user.email || user.uid} tidak memiliki izin administrator. Hubungi superadmin untuk menambahkan email ke ADMIN_EMAILS.`
        );
        return;
      }

      setIsAuthorized(true);

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
    } catch (err: any) {
      setIsAuthorized(false);
      setAuthError(err.message || "Gagal memuat data portal admin");
    } finally {
      setRefreshing(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadAdminData();
      } else {
        setIsAuthorized(null);
      }
    }
  }, [user, authLoading, loadAdminData]);

  // 1. Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <CircleNotch className="w-8 h-8 animate-spin text-purple-500" />
          <span className="text-xs">Memverifikasi kredensial admin...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <LockKey className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Yomirra Admin Portal</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Halaman ini terbatas untuk operator dan administrator sistem Yomirra. Silakan masuk untuk melanjutkan.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl transition"
          >
            Masuk dengan Akun Google
          </button>
          <div className="pt-2">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
              ← Kembali ke Beranda Yomirra
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthorized state (Logged in, but not an admin)
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full p-6 bg-zinc-900/80 border border-red-900/50 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Akses Ditolak</h1>
            <p className="text-xs text-red-300/90 mt-2 bg-red-950/40 p-3 rounded-xl border border-red-900/40 text-left">
              {authError || "Akun Anda tidak memiliki hak akses administrator."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => logout()}
              className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition"
            >
              Ganti Akun
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition"
            >
              Ke Situs Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingReportsCount = reports.filter((r) => r.status.toLowerCase() === "pending").length;

  // 4. Authorized Admin Shell
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-sm tracking-tight text-zinc-100">YOMIRRA</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Admin Ops
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAdminData()}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition"
              title="Perbarui seluruh data"
            >
              <ArrowsClockwise className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition"
            >
              <House className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Lihat Situs</span>
            </Link>

            <div className="h-4 w-px bg-zinc-800 mx-1" />

            <div className="flex items-center gap-2 pl-1">
              <span className="text-xs text-zinc-400 max-w-[130px] truncate hidden md:inline">
                {user.email}
              </span>
              <button
                onClick={() => logout()}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg transition"
                title="Keluar"
              >
                <SignOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto scrollbar-none gap-1 border-t border-zinc-900">
          {[
            { id: "overview", label: "Ringkasan", icon: ShieldCheck },
            { id: "sources", label: "Source Engine", icon: Heartbeat },
            { id: "search", label: "Pencarian", icon: MagnifyingGlass },
            { 
              id: "reports", 
              label: "Laporan Reader", 
              icon: Flag, 
              badge: pendingReportsCount > 0 ? pendingReportsCount : null 
            },
            { id: "site", label: "Situs & Banner", icon: Megaphone },
            { id: "telemetry", label: "Telemetri & Redis", icon: HardDrives },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === "overview" && (
          <OverviewTab
            sources={sources}
            reports={reports}
            telemetry={telemetry}
            siteConfig={siteConfig}
            onRefresh={loadAdminData}
            getToken={getToken}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "sources" && (
          <SourcesTab
            sources={sources}
            onRefresh={loadAdminData}
            getToken={getToken}
          />
        )}

        {activeTab === "search" && (
          <SearchTab getToken={getToken} />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            reports={reports}
            onRefresh={loadAdminData}
            getToken={getToken}
          />
        )}

        {activeTab === "site" && (
          <SiteTab
            initialConfig={siteConfig}
            onRefresh={loadAdminData}
            getToken={getToken}
          />
        )}

        {activeTab === "telemetry" && (
          <TelemetryTab
            initialTelemetry={telemetry}
            getToken={getToken}
            onRefresh={loadAdminData}
          />
        )}
      </main>
    </div>
  );
}
