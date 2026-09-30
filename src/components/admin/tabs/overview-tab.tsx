"use client";

import React, { useState } from "react";
import { 
  Heartbeat, 
  Flag, 
  HardDrives, 
  Megaphone, 
  ArrowsClockwise, 
  PaperPlaneTilt, 
  Trash, 
  CircleNotch,
  CheckCircle,
  WarningCircle
} from "@phosphor-icons/react";
import type { SourceHealthMatrixItem } from "@/server/lib/sources/admin-source-service";
import type { UserReport } from "@/server/lib/ops/admin-report-service";
import type { RedisTelemetry } from "@/server/lib/cache/admin-redis-service";
import type { SiteConfig } from "@/shared/types/site-config";

interface OverviewTabProps {
  sources: SourceHealthMatrixItem[];
  reports: UserReport[];
  telemetry: RedisTelemetry | null;
  siteConfig: SiteConfig | null;
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
  onNavigateTab: (tab: string) => void;
}

export function OverviewTab({
  sources,
  reports,
  telemetry,
  siteConfig,
  onRefresh,
  getToken,
  onNavigateTab,
}: OverviewTabProps) {
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; ok: boolean } | null>(null);

  const healthyCount = sources.filter((s) => s.status === "HEALTHY").length;
  const pendingReportsCount = reports.filter((r) => r.status.toLowerCase() === "pending").length;

  const handleQuickProbeAll = async () => {
    setRunningAction("probe-all");
    setActionFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sources/probe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ message: `Probe berhasil untuk ${data.results?.length || 0} source`, ok: true });
        await onRefresh();
      } else {
        setActionFeedback({ message: data.error || "Gagal probe source", ok: false });
      }
    } catch {
      setActionFeedback({ message: "Terjadi kesalahan jaringan", ok: false });
    } finally {
      setRunningAction(null);
    }
  };

  const handleTriggerDigest = async () => {
    setRunningAction("digest");
    setActionFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/ops/digest-trigger", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ message: data.message || "Daily digest berhasil dipicu", ok: true });
      } else {
        setActionFeedback({ message: data.error || "Gagal memicu daily digest", ok: false });
      }
    } catch {
      setActionFeedback({ message: "Terjadi kesalahan jaringan", ok: false });
    } finally {
      setRunningAction(null);
    }
  };

  const handleFlushGlobalCache = async () => {
    if (!confirm("Bersihkan seluruh cache source global (Redis)?")) return;
    setRunningAction("flush-cache");
    setActionFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sources/flush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ flushAll: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ message: data.message || "Cache global berhasil dibersihkan", ok: true });
        await onRefresh();
      } else {
        setActionFeedback({ message: data.error || "Gagal membersihkan cache", ok: false });
      }
    } catch {
      setActionFeedback({ message: "Terjadi kesalahan jaringan", ok: false });
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action feedback alert */}
      {actionFeedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
            actionFeedback.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {actionFeedback.ok ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <WarningCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Source Health Card */}
        <div 
          onClick={() => onNavigateTab("sources")}
          className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Source Engine</span>
            <Heartbeat className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100">{healthyCount}/{sources.length}</span>
            <span className="text-xs text-zinc-400">Normal</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {sources.length - healthyCount > 0 ? (
              <span className="text-amber-400 font-medium">{sources.length - healthyCount} perlu perhatian</span>
            ) : (
              <span className="text-emerald-400">Semua adapter aktif</span>
            )}
          </div>
        </div>

        {/* Reader Reports Card */}
        <div 
          onClick={() => onNavigateTab("reports")}
          className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Keluhan Reader</span>
            <Flag className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100">{pendingReportsCount}</span>
            <span className="text-xs text-zinc-400">Pending</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Total {reports.length} laporan tercatat
          </div>
        </div>

        {/* Redis Telemetry Card */}
        <div 
          onClick={() => onNavigateTab("telemetry")}
          className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Redis Cache</span>
            <HardDrives className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100">{telemetry?.usedMemory || "0B"}</span>
            <span className="text-xs text-zinc-400">Memory</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {telemetry?.totalSampledKeys || 0} key aktif · {telemetry?.uptimeDays || 0} hari uptime
          </div>
        </div>

        {/* Site Announcement & Mode Card */}
        <div 
          onClick={() => onNavigateTab("site")}
          className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Status Banner</span>
            <Megaphone className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-zinc-100">
              {siteConfig?.announcement.enabled ? "Banner Aktif" : "Banner Nonaktif"}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {siteConfig?.maintenanceMode.enabled ? (
              <span className="text-red-400 font-medium">⚠️ Maintenance Mode ON</span>
            ) : (
              <span className="text-zinc-400">Site Operasional Normal</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Ops Control Bar */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Aksi Cepat Operasional</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleQuickProbeAll}
            disabled={!!runningAction}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-xl transition"
          >
            {runningAction === "probe-all" ? (
              <CircleNotch className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <ArrowsClockwise className="w-4 h-4 text-emerald-400" />
            )}
            Probe Seluruh Source
          </button>

          <button
            onClick={handleTriggerDigest}
            disabled={!!runningAction}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-xl transition"
          >
            {runningAction === "digest" ? (
              <CircleNotch className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <PaperPlaneTilt className="w-4 h-4 text-purple-400" />
            )}
            Kirim Ringkasan ke Telegram
          </button>

          <button
            onClick={handleFlushGlobalCache}
            disabled={!!runningAction}
            className="flex items-center gap-2 px-3 py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 disabled:opacity-50 text-red-200 text-xs font-medium rounded-xl transition"
          >
            {runningAction === "flush-cache" ? (
              <CircleNotch className="w-4 h-4 animate-spin text-red-400" />
            ) : (
              <Trash className="w-4 h-4 text-red-400" />
            )}
            Flush Cache Global Source
          </button>
        </div>
      </div>

      {/* Recent User Reports Feed Preview */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">Keluhan Reader Terbaru</h3>
          <button
            onClick={() => onNavigateTab("reports")}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            Buka Semua ({reports.length}) →
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3">Belum ada keluhan yang dilaporkan pembaca.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {reports.slice(0, 4).map((report) => (
              <div key={report.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{report.mangaId || report.sourceId || "Manga"}</span>
                    {report.chapterTitle && <span className="text-zinc-500">{report.chapterTitle}</span>}
                    {report.sourceId && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] uppercase font-mono">
                        {report.sourceId}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 mt-0.5">{report.detail || report.category || report.type}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    report.status.toLowerCase() === "pending"
                      ? "bg-amber-500/20 text-amber-300"
                      : report.status.toLowerCase() === "resolved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
