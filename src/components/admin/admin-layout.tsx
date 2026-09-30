"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CircleNotch,
  Command,
  Eye,
  EyeSlash,
  Flag,
  HardDrives,
  Heartbeat,
  House,
  List,
  LockKey,
  MagnifyingGlass,
  Megaphone,
  ShieldCheck,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { OverviewTab } from "./tabs/overview-tab";
import { SourcesTab } from "./tabs/sources-tab";
import { SearchTab } from "./tabs/search-tab";
import { ReportsTab } from "./tabs/reports-tab";
import { SiteTab } from "./tabs/site-tab";
import { TelemetryTab } from "./tabs/telemetry-tab";
import { OpsButton, StatusPill, cx } from "./components/admin-ui";

import type { SourceHealthMatrixItem } from "@/server/lib/sources/admin-source-service";
import type { UserReport } from "@/server/lib/ops/admin-report-service";
import type { RedisTelemetry } from "@/server/lib/cache/admin-redis-service";
import type { SiteConfig } from "@/shared/types/site-config";

type AdminTab = "overview" | "sources" | "search" | "reports" | "site" | "telemetry";

type NavItem = {
  id: AdminTab;
  label: string;
  subtitle: string;
  group: "Overview" | "Discovery" | "Operations";
  icon: React.ComponentType<{ className?: string; weight?: "fill" | "regular" | "bold" }>;
  badge?: React.ReactNode;
};

const VALID_TABS = new Set<AdminTab>([
  "overview",
  "sources",
  "search",
  "reports",
  "site",
  "telemetry",
]);

function readTabFromUrl(): AdminTab {
  if (typeof window === "undefined") return "overview";
  const view = new URLSearchParams(window.location.search).get("view") as AdminTab | null;
  return view && VALID_TABS.has(view) ? view : "overview";
}

function formatClock(date: Date | null) {
  if (!date) return "Belum disinkronkan";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function AdminLayout() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [sources, setSources] = useState<SourceHealthMatrixItem[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [telemetry, setTelemetry] = useState<RedisTelemetry | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (adminKey) return adminKey;
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("yomirra_admin_key");
  }, [adminKey]);

  const loadAdminData = useCallback(async (keyToUse: string) => {
    if (!keyToUse) return;
    setRefreshing(true);
    setAuthError(null);

    try {
      const headers = {
        "x-admin-key": keyToUse,
        Authorization: `Bearer ${keyToUse}`,
      };

      const [srcRes, repRes, telemRes, siteRes] = await Promise.all([
        fetch("/api/admin/sources", { headers }),
        fetch("/api/admin/reports", { headers }),
        fetch("/api/admin/ops/telemetry", { headers }),
        fetch("/api/admin/site/config", { headers }),
      ]);

      if ([srcRes, repRes, telemRes, siteRes].some((res) => res.status === 401 || res.status === 403)) {
        setIsAuthorized(false);
        setAdminKey("");
        setAuthError("Kunci akses ditolak oleh server. Masukkan ulang passkey administrator.");
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

      setLastUpdated(new Date());
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Gagal memuat data portal admin");
    } finally {
      setRefreshing(false);
      setVerifying(false);
    }
  }, []);

  useEffect(() => {
    setActiveTab(readTabFromUrl());

    const handlePopState = () => setActiveTab(readTabFromUrl());
    window.addEventListener("popstate", handlePopState);

    const saved = sessionStorage.getItem("yomirra_admin_key");
    if (saved) {
      setAdminKey(saved);
      void loadAdminData(saved);
    } else {
      setVerifying(false);
      setIsAuthorized(false);
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadAdminData]);

  const navigateTo = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);

    const url = new URL(window.location.href);
    if (tab === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", tab);
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const key = passkeyInput.trim();
    if (!key) return;

    setVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/sources", {
        headers: {
          "x-admin-key": key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (!res.ok) {
        setIsAuthorized(false);
        setAuthError("Kunci akses salah atau tidak memiliki izin administrator.");
        setVerifying(false);
        return;
      }

      sessionStorage.setItem("yomirra_admin_key", key);
      document.cookie = `yomirra_admin_key=${encodeURIComponent(key)}; path=/; max-age=604800; samesite=lax`;
      setAdminKey(key);
      setIsAuthorized(true);
      await loadAdminData(key);
    } catch {
      setAuthError("Server tidak dapat dihubungi untuk memvalidasi akses.");
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
    setSources([]);
    setReports([]);
    setTelemetry(null);
    setSiteConfig(null);
  };

  const enabledSources = sources.filter((source) => source.isEnabled).length;
  const healthySources = sources.filter((source) => source.status === "HEALTHY").length;
  const pendingReports = reports.filter((report) => report.status.toLowerCase() === "pending").length;
  const hasSourceIssue = sources.some(
    (source) => source.isEnabled && source.status !== "HEALTHY",
  );
  const siteInMaintenance = Boolean(siteConfig?.maintenanceMode.enabled);
  const runtimeConnected = telemetry?.status === "connected";
  const systemHealthy = !hasSourceIssue && !siteInMaintenance;

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        id: "overview",
        label: "Ringkasan",
        subtitle: "Kondisi operasional keseluruhan",
        group: "Overview",
        icon: House,
      },
      {
        id: "sources",
        label: "Source Health",
        subtitle: "Health, domain, dan adapter source",
        group: "Discovery",
        icon: Heartbeat,
        badge: `${enabledSources}/${sources.length}`,
      },
      {
        id: "search",
        label: "Search Lab",
        subtitle: "Ranking dan katalog pencarian",
        group: "Discovery",
        icon: MagnifyingGlass,
      },
      {
        id: "reports",
        label: "Reader Reports",
        subtitle: "Triage laporan dari pembaca",
        group: "Operations",
        icon: Flag,
        badge: pendingReports || undefined,
      },
      {
        id: "site",
        label: "Site Control",
        subtitle: "Banner dan mode pemeliharaan",
        group: "Operations",
        icon: Megaphone,
        badge: siteInMaintenance ? "Maint." : siteConfig?.announcement.enabled ? "Banner" : undefined,
      },
      {
        id: "telemetry",
        label: "Infrastructure",
        subtitle: "Redis, cache, dan ops messaging",
        group: "Operations",
        icon: HardDrives,
        badge: runtimeConnected ? "OK" : undefined,
      },
    ],
    [enabledSources, pendingReports, runtimeConnected, siteConfig?.announcement.enabled, siteInMaintenance, sources.length],
  );

  const activeTabMeta = navItems.find((item) => item.id === activeTab) ?? navItems[0];

  if (verifying && isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-400">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-8 py-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400">
            <CircleNotch className="h-5 w-5 animate-spin" />
          </div>
          <span className="text-xs">Memverifikasi sesi administrator…</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4 text-zinc-100">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-red-500/[0.06] blur-3xl" />

        <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-black/50">
          <div className="border-b border-zinc-800/90 px-7 py-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-300">
                  Y
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">Yomirra</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Operations</p>
                </div>
              </div>
              <StatusPill tone="neutral">Restricted</StatusPill>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-300">
              <LockKey className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight">Administrator gate</h1>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Masukkan passkey administrator untuk membuka kontrol operasional Yomirra.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 px-7 py-6">
            {authError ? (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs leading-5 text-rose-200">
                {authError}
              </div>
            ) : null}

            <div>
              <label htmlFor="admin-passkey" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                Passkey administrator
              </label>
              <div className="relative">
                <input
                  id="admin-passkey"
                  type={showPasskey ? "text" : "password"}
                  autoFocus
                  required
                  autoComplete="current-password"
                  value={passkeyInput}
                  onChange={(event) => setPasskeyInput(event.target.value)}
                  placeholder="Masukkan kunci akses admin…"
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 pr-11 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey((value) => !value)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-300"
                  aria-label={showPasskey ? "Sembunyikan passkey" : "Tampilkan passkey"}
                >
                  {showPasskey ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <OpsButton type="submit" variant="primary" className="h-11 w-full" disabled={verifying || !passkeyInput.trim()}>
              {verifying ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" weight="fill" />}
              {verifying ? "Memvalidasi akses…" : "Buka Operations Portal"}
            </OpsButton>
          </form>

          <div className="border-t border-zinc-800/80 px-7 py-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 transition hover:text-zinc-300">
              <ArrowSquareOut className="h-3.5 w-3.5" />
              Kembali ke Yomirra Reader
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const groups: NavItem["group"][] = ["Overview", "Discovery", "Operations"];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-red-500/30 selection:text-white md:flex">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900 md:flex">
        <div className="border-b border-zinc-800/80 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-300">Y</div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-100">Yomirra</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Operations</p>
              </div>
            </div>
            <StatusPill tone="neutral" className="font-mono">PROD</StatusPill>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => {
            const groupItems = navItems.filter((item) => item.group === group);
            return (
              <div key={group} className="mb-5 last:mb-0">
                <p className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-700">{group}</p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeTab;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        className={cx(
                          "group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors",
                          isActive
                            ? "border-red-500/20 bg-red-500/10 text-zinc-100"
                            : "border-transparent text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-200",
                        )}
                      >
                        <Icon className={cx("h-4 w-4 shrink-0", isActive ? "text-red-400" : "text-zinc-600 group-hover:text-zinc-400")} weight={isActive ? "fill" : "regular"} />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">{item.label}</span>
                        {item.badge !== undefined ? (
                          <span className={cx("rounded-md px-1.5 py-0.5 text-[9px] font-semibold tabular-nums", isActive ? "bg-red-500/15 text-red-300" : "bg-zinc-900 text-zinc-600")}>{item.badge}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800/80 p-3">
          <div className="mb-2 rounded-xl border border-zinc-800/80 bg-zinc-900/45 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-300">Admin operator</p>
                <p className="mt-0.5 text-[10px] text-zinc-600">Authenticated session</p>
              </div>
              <StatusPill tone="brand">Admin</StatusPill>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-medium text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <ArrowSquareOut className="h-3.5 w-3.5" />
              Public site
            </Link>
            <button
              type="button"
              onClick={handleLock}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
              title="Kunci portal"
              aria-label="Kunci portal"
            >
              <SignOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-[120] flex bg-black/70 backdrop-blur-sm md:hidden">
          <aside className="flex h-full w-[280px] flex-col border-r border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-300">Y</div>
                <div>
                  <p className="text-sm font-semibold">Yomirra</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">Operations</p>
                </div>
              </div>
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-200" aria-label="Tutup navigasi">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {groups.map((group) => (
                <div key={group} className="mb-5">
                  <p className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-700">{group}</p>
                  <div className="space-y-1">
                    {navItems.filter((item) => item.group === group).map((item) => {
                      const Icon = item.icon;
                      const isActive = item.id === activeTab;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateTo(item.id)}
                          className={cx(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                            isActive ? "bg-red-500/10 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200",
                          )}
                        >
                          <Icon className={cx("h-4 w-4", isActive ? "text-red-400" : "text-zinc-600")} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">{item.label}</p>
                            <p className="truncate text-[10px] text-zinc-600">{item.subtitle}</p>
                          </div>
                          {item.badge !== undefined ? <span className="text-[10px] text-zinc-600">{item.badge}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-zinc-800 p-3">
              <OpsButton type="button" variant="danger" className="w-full" onClick={handleLock}>
                <SignOut className="h-4 w-4" />
                Kunci portal
              </OpsButton>
            </div>
          </aside>
          <button type="button" className="flex-1" onClick={() => setMobileSidebarOpen(false)} aria-label="Tutup navigasi" />
        </div>
      ) : null}

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
          <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 md:hidden"
                aria-label="Buka navigasi"
              >
                <List className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-100">{activeTabMeta.label}</h1>
                  <span className="hidden text-zinc-800 sm:inline">/</span>
                  <span className="hidden truncate text-[11px] text-zinc-600 sm:inline">{activeTabMeta.subtitle}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-700 sm:hidden">{activeTabMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 lg:flex">
                <StatusPill tone={systemHealthy ? "success" : "warning"} dot>
                  {systemHealthy ? "Operational" : "Attention"}
                </StatusPill>
                <StatusPill tone={runtimeConnected ? "neutral" : "warning"} dot>
                  {runtimeConnected ? "Redis connected" : "Cache fallback"}
                </StatusPill>
              </div>

              <button
                type="button"
                disabled
                className="hidden h-8 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2.5 text-[10px] text-zinc-700 xl:inline-flex"
                title="Command palette disiapkan untuk fase berikutnya"
              >
                <Command className="h-3.5 w-3.5" />
                Command
                <kbd className="rounded border border-zinc-800 bg-zinc-950 px-1 py-0.5 font-mono text-[9px]">⌘K</kbd>
              </button>

              <OpsButton type="button" size="sm" variant="secondary" onClick={() => void loadAdminData(adminKey)} disabled={refreshing}>
                <ArrowsClockwise className={cx("h-3.5 w-3.5", refreshing && "animate-spin text-red-400")} />
                <span className="hidden sm:inline">Segarkan</span>
              </OpsButton>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-900 pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400/90">Yomirra Ops</p>
              <p className="mt-1 text-[11px] text-zinc-700">Terakhir sinkron: {formatClock(lastUpdated)}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-700">
              <span>{healthySources}/{sources.length || 0} source healthy</span>
              <span>·</span>
              <span>{pendingReports} pending report</span>
            </div>
          </div>

          {activeTab === "overview" ? (
            <OverviewTab
              sources={sources}
              reports={reports}
              telemetry={telemetry}
              siteConfig={siteConfig}
              onRefresh={() => loadAdminData(adminKey)}
              getToken={getToken}
              onNavigateTab={(tab) => navigateTo(tab as AdminTab)}
            />
          ) : null}

          {activeTab === "sources" ? (
            <SourcesTab sources={sources} onRefresh={() => loadAdminData(adminKey)} getToken={getToken} />
          ) : null}

          {activeTab === "search" ? <SearchTab getToken={getToken} /> : null}

          {activeTab === "reports" ? (
            <ReportsTab reports={reports} onRefresh={() => loadAdminData(adminKey)} getToken={getToken} />
          ) : null}

          {activeTab === "site" ? (
            <SiteTab initialConfig={siteConfig} onRefresh={() => loadAdminData(adminKey)} getToken={getToken} />
          ) : null}

          {activeTab === "telemetry" ? (
            <TelemetryTab initialTelemetry={telemetry} onRefresh={() => loadAdminData(adminKey)} getToken={getToken} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
