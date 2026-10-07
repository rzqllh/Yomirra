"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  CircleNotch,
  Flag,
  HardDrives,
  Heartbeat,
  Megaphone,
  PaperPlaneTilt,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  ConfirmDialog,
  FeedbackBanner,
  MetricCell,
  OpsButton,
  OpsCard,
  OpsSectionHeader,
  StatusPill,
  cx,
} from "../components/admin-ui";
import type { RedisTelemetry, SourceHealthMatrixItem } from "@/shared/types/admin";
import type { UserReport } from "@/shared/types/report";
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

type AttentionItem = {
  id: string;
  level: "warning" | "danger" | "neutral";
  title: string;
  detail: string;
  tab: string;
};

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
  const [flushConfirmOpen, setFlushConfirmOpen] = useState(false);

  const enabledSources = sources.filter((source) => source.isEnabled);
  const healthyCount = enabledSources.filter((source) => source.status === "HEALTHY").length;
  const pendingReports = reports.filter((report) => report.status.toLowerCase() === "pending");
  const redisConnected = telemetry?.status === "connected";
  const maintenanceEnabled = Boolean(siteConfig?.maintenanceMode.enabled);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    enabledSources
      .filter((source) => source.status !== "HEALTHY")
      .slice(0, 3)
      .forEach((source) => {
        items.push({
          id: `source-${source.id}`,
          level: source.status === "DOWN" ? "danger" : "warning",
          title: `${source.name} ${source.status === "DOWN" ? "down" : "degraded"}`,
          detail: source.latencyMs > 0 ? `Latency terakhir ${source.latencyMs} ms` : "Health check memerlukan inspeksi",
          tab: "sources",
        });
      });

    if (pendingReports.length > 0) {
      items.push({
        id: "pending-reports",
        level: "warning",
        title: `${pendingReports.length} laporan menunggu triage`,
        detail: "Reader report belum masuk tahap investigasi atau resolved.",
        tab: "reports",
      });
    }

    if (maintenanceEnabled) {
      items.push({
        id: "maintenance",
        level: "danger",
        title: "Maintenance mode aktif",
        detail: "Akses publik saat ini dibatasi oleh Site Control.",
        tab: "site",
      });
    }

    if (telemetry && !redisConnected) {
      items.push({
        id: "redis",
        level: "warning",
        title: "Redis tidak terhubung",
        detail: "Runtime memakai fallback cache. Setel REDIS_URL di Vercel env untuk sinkronisasi antrian & TTL.",
        tab: "telemetry",
      });
    }

    return items;
  }, [enabledSources, maintenanceEnabled, pendingReports.length, redisConnected, telemetry]);

  const systemOperational = attentionItems.every((item) => item.level === "neutral");

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
        const summary = data.summary;
        const message = summary
          ? `Probe selesai: ${summary.success}/${summary.total} source sehat${summary.failed ? `, ${summary.failed} gagal` : ""}.`
          : `Probe selesai untuk ${data.results?.length || 0} source.`;
        setActionFeedback({ message, ok: summary ? summary.failed === 0 : true });
        await onRefresh();
      } else {
        setActionFeedback({ message: data.error || "Gagal melakukan probe source.", ok: false });
      }
    } catch {
      setActionFeedback({ message: "Server tidak dapat dihubungi saat menjalankan probe.", ok: false });
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setActionFeedback({
        message: res.ok ? data.message || "Daily digest berhasil dipicu." : data.error || "Gagal memicu daily digest.",
        ok: res.ok,
      });
    } catch {
      setActionFeedback({ message: "Server tidak dapat dihubungi saat memicu digest.", ok: false });
    } finally {
      setRunningAction(null);
    }
  };

  const handleFlushGlobalCache = async () => {
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
        setActionFeedback({ message: data.message || "Cache global berhasil dibersihkan.", ok: true });
        await onRefresh();
      } else {
        setActionFeedback({ message: data.error || "Gagal membersihkan cache global.", ok: false });
      }
    } catch {
      setActionFeedback({ message: "Server tidak dapat dihubungi saat membersihkan cache.", ok: false });
    } finally {
      setRunningAction(null);
      setFlushConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <OpsCard className="overflow-hidden">
        <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cx(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                  systemOperational
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-300",
                )}
              >
                {systemOperational ? <Heartbeat className="h-5 w-5" weight="fill" /> : <WarningCircle className="h-5 w-5" weight="fill" />}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Operational pulse</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                    {systemOperational ? "Sistem operasional" : "Ada item yang perlu diperiksa"}
                  </h2>
                  <StatusPill tone={systemOperational ? "success" : "warning"} dot>
                    {systemOperational ? "Healthy" : `${attentionItems.length} attention`}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Status ini diringkas dari source health, reader reports, site control, dan runtime cache.
                </p>
              </div>
            </div>

            <OpsButton type="button" variant="secondary" onClick={() => void handleQuickProbeAll()} disabled={Boolean(runningAction)}>
              {runningAction === "probe-all" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowsClockwise className="h-4 w-4" />}
              Probe seluruh source
            </OpsButton>
          </div>
        </div>

        <div className="grid divide-y divide-zinc-800/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <button type="button" onClick={() => onNavigateTab("sources")} className="text-left transition hover:bg-zinc-900/70">
            <MetricCell
              label="Source health"
              value={`${healthyCount}/${enabledSources.length || 0}`}
              hint={`${sources.length - enabledSources.length} source nonaktif`}
              tone={healthyCount === enabledSources.length ? "success" : "warning"}
            />
          </button>
          <button type="button" onClick={() => onNavigateTab("reports")} className="text-left transition hover:bg-zinc-900/70">
            <MetricCell label="Pending reports" value={pendingReports.length} hint={`${reports.length} total laporan`} tone={pendingReports.length ? "warning" : "neutral"} />
          </button>
          <button type="button" onClick={() => onNavigateTab("telemetry")} className="text-left transition hover:bg-zinc-900/70">
            <MetricCell
              label="Runtime cache"
              value={redisConnected ? "Connected" : "Fallback"}
              hint={`${telemetry?.usedMemory || "0B"} memory · ${telemetry?.totalSampledKeys || 0} keys`}
              tone={redisConnected ? "success" : telemetry ? "warning" : "neutral"}
            />
          </button>
          <button type="button" onClick={() => onNavigateTab("site")} className="text-left transition hover:bg-zinc-900/70">
            <MetricCell
              label="Public site"
              value={maintenanceEnabled ? "Maintenance" : "Normal"}
              hint={siteConfig?.announcement.enabled ? "Announcement banner aktif" : "Tidak ada banner aktif"}
              tone={maintenanceEnabled ? "danger" : "neutral"}
            />
          </button>
        </div>
      </OpsCard>

      {actionFeedback ? (
        <FeedbackBanner message={actionFeedback.message} ok={actionFeedback.ok} onDismiss={() => setActionFeedback(null)} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <OpsCard className="overflow-hidden">
          <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
            <OpsSectionHeader
              eyebrow="Triage"
              title="Needs attention"
              description="Item yang berpotensi membutuhkan tindakan operator sekarang."
            />
          </div>

          {attentionItems.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center px-5 py-8 text-center">
              <div>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <Heartbeat className="h-5 w-5" weight="fill" />
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-300">Tidak ada issue aktif</p>
                <p className="mt-1 text-xs text-zinc-600">Semua sinyal operasional yang tersedia berada pada kondisi normal.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {attentionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab(item.tab)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-900/70 sm:px-5"
                >
                  <span
                    className={cx(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      item.level === "danger" ? "bg-rose-400" : item.level === "warning" ? "bg-amber-400" : "bg-zinc-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-zinc-200">{item.title}</p>
                      <StatusPill tone={item.level === "danger" ? "danger" : item.level === "warning" ? "warning" : "neutral"}>
                        {item.level === "danger" ? "High" : item.level === "warning" ? "Review" : "Info"}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-600">{item.detail}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-700" />
                </button>
              ))}
            </div>
          )}
        </OpsCard>

        <OpsCard className="p-4 sm:p-5">
          <OpsSectionHeader eyebrow="Operator" title="Quick operations" description="Aksi manual yang tidak perlu membuka detail modul." />
          <div className="mt-4 space-y-2">
            <OpsButton type="button" variant="secondary" className="w-full justify-start" onClick={() => void handleQuickProbeAll()} disabled={Boolean(runningAction)}>
              {runningAction === "probe-all" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Heartbeat className="h-4 w-4 text-emerald-400" />}
              Probe source health
            </OpsButton>
            <OpsButton type="button" variant="secondary" className="w-full justify-start" onClick={() => void handleTriggerDigest()} disabled={Boolean(runningAction)}>
              {runningAction === "digest" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneTilt className="h-4 w-4 text-zinc-500" />}
              Trigger Telegram digest
            </OpsButton>
            <OpsButton type="button" variant="danger" className="w-full justify-start" onClick={() => setFlushConfirmOpen(true)} disabled={Boolean(runningAction)}>
              {runningAction === "flush-cache" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
              Flush global source cache
            </OpsButton>
          </div>
        </OpsCard>
      </div>

      <OpsCard className="overflow-hidden">
        <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
          <OpsSectionHeader
            eyebrow="Reader signal"
            title="Laporan terbaru"
            description="Sampel laporan terbaru untuk melihat pola issue sebelum masuk ke inbox penuh."
            action={
              <button type="button" onClick={() => onNavigateTab("reports")} className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300">
                Buka inbox <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>

        {reports.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-zinc-600">Belum ada laporan reader yang tercatat.</div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {reports.slice(0, 5).map((report) => {
              const status = report.status.toLowerCase();
              return (
                <button
                  type="button"
                  key={report.id}
                  onClick={() => onNavigateTab("reports")}
                  className="grid w-full gap-2 px-4 py-3 text-left transition hover:bg-zinc-900/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs font-medium text-zinc-200">{report.mangaTitle || report.mangaId || "Manga"}</span>
                      {report.sourceId ? <span className="rounded-md bg-zinc-950 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-600">{report.sourceId}</span> : null}
                    </div>
                    <p className="mt-1 truncate text-[11px] text-zinc-600">{report.detail || report.chapterTitle || report.category || report.type}</p>
                  </div>
                  <StatusPill tone={status === "pending" ? "warning" : status === "resolved" ? "success" : "neutral"}>
                    {report.status}
                  </StatusPill>
                </button>
              );
            })}
          </div>
        )}
      </OpsCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={() => onNavigateTab("sources")} className="text-left">
          <OpsCard className="h-full p-4 transition hover:border-zinc-700 hover:bg-zinc-900/70">
            <Heartbeat className="h-4 w-4 text-zinc-600" />
            <p className="mt-3 text-xs font-medium text-zinc-300">Source Health</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-600">Probe, domain override, mirrors, dan source custom.</p>
          </OpsCard>
        </button>
        <button type="button" onClick={() => onNavigateTab("reports")} className="text-left">
          <OpsCard className="h-full p-4 transition hover:border-zinc-700 hover:bg-zinc-900/70">
            <Flag className="h-4 w-4 text-zinc-600" />
            <p className="mt-3 text-xs font-medium text-zinc-300">Reader Reports</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-600">Triage, investigasi, dan tindakan source terkait.</p>
          </OpsCard>
        </button>
        <button type="button" onClick={() => onNavigateTab("site")} className="text-left">
          <OpsCard className="h-full p-4 transition hover:border-zinc-700 hover:bg-zinc-900/70">
            <Megaphone className="h-4 w-4 text-zinc-600" />
            <p className="mt-3 text-xs font-medium text-zinc-300">Site Control</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-600">Public announcement dan maintenance state.</p>
          </OpsCard>
        </button>
        <button type="button" onClick={() => onNavigateTab("telemetry")} className="text-left">
          <OpsCard className="h-full p-4 transition hover:border-zinc-700 hover:bg-zinc-900/70">
            <HardDrives className="h-4 w-4 text-zinc-600" />
            <p className="mt-3 text-xs font-medium text-zinc-300">Infrastructure</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-600">Redis telemetry, key explorer, dan ops messaging.</p>
          </OpsCard>
        </button>
      </div>

      <ConfirmDialog
        open={flushConfirmOpen}
        title="Flush seluruh source cache?"
        description="Semua cache source global di Redis akan dibersihkan. Request setelah ini dapat memicu fetch ulang ke upstream."
        confirmLabel="Flush cache"
        danger
        busy={runningAction === "flush-cache"}
        onClose={() => setFlushConfirmOpen(false)}
        onConfirm={() => void handleFlushGlobalCache()}
      />
    </div>
  );
}
