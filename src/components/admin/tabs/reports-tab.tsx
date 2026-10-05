"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowSquareOut,
  BookOpen,
  Check,
  CircleNotch,
  Flag,
  Hash,
  Image as ImageIcon,
  Lightning,
  MagnifyingGlass,
  Question,
  SealCheck,
  Trash,
  Wrench,
} from "@phosphor-icons/react";
import type { UserReport } from "@/server/lib/ops/admin-report-service";
import {
  EmptyState,
  FeedbackBanner,
  MetricCell,
  OpsButton,
  OpsCard,
  OpsSectionHeader,
  StatusPill,
  cx,
} from "../components/admin-ui";

interface ReportsTabProps {
  reports: UserReport[];
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; tone: "neutral" | "warning" | "danger" }> = {
  chapter_error: { label: "Chapter error", icon: <BookOpen className="h-4 w-4" />, tone: "warning" },
  image_broken: { label: "Gambar rusak", icon: <ImageIcon className="h-4 w-4" />, tone: "danger" },
  source_broken: { label: "Source bermasalah", icon: <Wrench className="h-4 w-4" />, tone: "danger" },
  other: { label: "Lainnya", icon: <Question className="h-4 w-4" />, tone: "neutral" },
};

function ticketId(id: string) {
  return id.replace("rep_", "").split("_").pop()?.toUpperCase() ?? id.slice(-5).toUpperCase();
}

function reportTone(status: string): "neutral" | "warning" | "success" | "brand" {
  if (status === "pending") return "warning";
  if (status === "resolved") return "success";
  if (status === "investigating") return "brand";
  return "neutral";
}

function reportLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "investigating") return "Investigating";
  if (status === "resolved") return "Resolved";
  return status;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ReportsTab({ reports, onRefresh, getToken }: ReportsTabProps) {
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      pending: reports.filter((report) => report.status === "pending").length,
      investigating: reports.filter((report) => report.status === "investigating").length,
      resolved: reports.filter((report) => report.status === "resolved").length,
    }),
    [reports],
  );

  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reports.filter((report) => {
      const statusMatch = filter === "ALL" || report.status.toLowerCase() === filter.toLowerCase();
      if (!statusMatch) return false;
      if (!normalized) return true;
      return [report.mangaTitle, report.mangaId, report.chapterTitle, report.sourceId, report.detail, report.category, report.type, report.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [filter, query, reports]);

  const handleUpdateStatus = async (reportId: string, status: "pending" | "investigating" | "resolved") => {
    setActionLoadingId(`${reportId}-${status}`);
    setFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reportId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: `Tiket #${ticketId(reportId)} diubah ke ${reportLabel(status)}.`, ok: true });
        await onRefresh();
      } else {
        setFeedback({ text: data.error || "Status tiket gagal diperbarui.", ok: false });
      }
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat memperbarui tiket.", ok: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReportAction = async (
    reportId: string,
    sourceId?: string,
    action: "flush_source_cache" | "probe_source" = "probe_source",
  ) => {
    setActionLoadingId(`${reportId}-${action}`);
    setFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/reports/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reportId, sourceId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || "Tindakan operasional selesai.", ok: true });
        await onRefresh();
      } else {
        setFeedback({ text: data.error || "Tindakan operasional gagal.", ok: false });
      }
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat menjalankan tindakan.", ok: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <OpsSectionHeader
        eyebrow="Reader operations"
        title="Reader Reports"
        description="Inbox untuk triage laporan gambar rusak, chapter error, dan source bermasalah dari pembaca."
      />

      {feedback ? <FeedbackBanner message={feedback.text} ok={feedback.ok} onDismiss={() => setFeedback(null)} /> : null}

      <OpsCard className="overflow-hidden">
        <div className="grid divide-y divide-zinc-800/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricCell label="Pending" value={counts.pending} hint="Belum masuk investigasi" tone={counts.pending ? "warning" : "neutral"} />
          <MetricCell label="Investigating" value={counts.investigating} hint="Sedang ditangani operator" tone={counts.investigating ? "brand" : "neutral"} />
          <MetricCell label="Resolved" value={counts.resolved} hint={`${reports.length} total tiket`} tone="success" />
        </div>
      </OpsCard>

      <OpsCard className="overflow-hidden">
        <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-300">Inbox</p>
              <p className="mt-1 text-[11px] text-zinc-600">{filteredReports.length} tiket pada view saat ini.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-[220px]">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-700" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari judul, source, tiket…"
                  className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-8 pr-3 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                />
              </div>
              <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
                {["ALL", "pending", "investigating", "resolved"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    className={cx(
                      "rounded-lg px-2.5 py-1 text-[10px] font-medium transition",
                      filter === status ? "bg-zinc-800 text-zinc-100" : "text-zinc-600 hover:text-zinc-300",
                    )}
                  >
                    {status === "ALL" ? "Semua" : reportLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <EmptyState icon={<Flag className="h-5 w-5" />} title="Tidak ada tiket pada filter ini" description="Ubah status filter atau kata pencarian untuk melihat tiket lain." />
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredReports.map((report) => {
              const typeConfig = TYPE_CONFIG[report.type] ?? TYPE_CONFIG.other;
              const status = report.status.toLowerCase();
              const isExpanded = expandedId === report.id;

              return (
                <article key={report.id} className={cx("transition-colors", status === "resolved" && "opacity-65")}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-zinc-900/60 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5"
                    aria-expanded={isExpanded}
                  >
                    <div className={cx("flex h-9 w-9 items-center justify-center rounded-xl border", typeConfig.tone === "danger" ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : typeConfig.tone === "warning" ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-zinc-800 bg-zinc-950/60 text-zinc-500")}>{typeConfig.icon}</div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={reportTone(status)} dot>{reportLabel(status)}</StatusPill>
                        <span className="text-[11px] font-medium text-zinc-400">{typeConfig.label}</span>
                        {report.sourceId ? <span className="rounded-md bg-zinc-950 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-700">{report.sourceId}</span> : null}
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-zinc-200">{report.mangaTitle || report.mangaId || "Untitled manga"}</p>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-600">{report.chapterTitle || report.detail || report.category || report.type}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-700"><Hash className="h-3 w-3" />{ticketId(report.id)}</span>
                      <p className="mt-0 sm:mt-1 text-[10px] text-zinc-700">{formatDate(report.createdAt)} WIB</p>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-zinc-800/70 bg-zinc-950/20 px-4 py-4 sm:px-5">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="space-y-3">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/45 px-3 py-2.5"><p className="text-[9px] uppercase tracking-wide text-zinc-700">Category</p><p className="mt-1 text-xs text-zinc-300">{report.category || report.type}</p></div>
                            {report.sourceId ? <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/45 px-3 py-2.5"><p className="text-[9px] uppercase tracking-wide text-zinc-700">Source</p><p className="mt-1 font-mono text-xs uppercase text-zinc-300">{report.sourceId}</p></div> : null}
                            {typeof report.pageIndex === "number" ? <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/45 px-3 py-2.5"><p className="text-[9px] uppercase tracking-wide text-zinc-700">Page</p><p className="mt-1 text-xs text-zinc-300">#{report.pageIndex + 1}</p></div> : null}
                            {report.resolvedAt ? <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/45 px-3 py-2.5"><p className="text-[9px] uppercase tracking-wide text-zinc-700">Resolved</p><p className="mt-1 text-xs text-zinc-300">{formatDate(report.resolvedAt)}</p></div> : null}
                          </div>

                          {report.detail ? (
                            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/45 px-3 py-3">
                              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-700">Catatan pengguna</p>
                              <p className="mt-1.5 text-xs leading-5 text-zinc-400">{report.detail}</p>
                            </div>
                          ) : null}

                          <div className="font-mono text-[9px] leading-4 text-zinc-800">
                            <p>ticket: {report.id}</p>
                            {report.mangaId ? <p>manga: {report.mangaId}</p> : null}
                            {report.chapterId ? <p>chapter: {report.chapterId}</p> : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap content-start gap-2 lg:max-w-72 lg:justify-end">
                          {report.chapterId && report.sourceId ? (
                            <a href={`/reader/${report.sourceId}/${encodeURIComponent(report.chapterId)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"><ArrowSquareOut className="h-3.5 w-3.5" />Inspect reader</a>
                          ) : null}

                          {report.sourceId ? (
                            <>
                              <OpsButton type="button" size="sm" variant="secondary" onClick={() => void handleReportAction(report.id, report.sourceId, "probe_source")} disabled={Boolean(actionLoadingId)}>
                                {actionLoadingId === `${report.id}-probe_source` ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Lightning className="h-3.5 w-3.5 text-emerald-400" />}Probe
                              </OpsButton>
                              <OpsButton type="button" size="sm" variant="danger" onClick={() => void handleReportAction(report.id, report.sourceId, "flush_source_cache")} disabled={Boolean(actionLoadingId)}>
                                {actionLoadingId === `${report.id}-flush_source_cache` ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}Flush
                              </OpsButton>
                            </>
                          ) : null}

                          {status === "pending" ? (
                            <OpsButton type="button" size="sm" variant="secondary" onClick={() => void handleUpdateStatus(report.id, "investigating")} disabled={Boolean(actionLoadingId)}>
                              {actionLoadingId === `${report.id}-investigating` ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <MagnifyingGlass className="h-3.5 w-3.5" />}Investigasi
                            </OpsButton>
                          ) : null}

                          {status !== "resolved" ? (
                            <OpsButton type="button" size="sm" variant="primary" onClick={() => void handleUpdateStatus(report.id, "resolved")} disabled={Boolean(actionLoadingId)}>
                              {actionLoadingId === `${report.id}-resolved` ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Resolve
                            </OpsButton>
                          ) : (
                            <StatusPill tone="success"><SealCheck className="h-3 w-3" weight="fill" />Closed</StatusPill>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </OpsCard>
    </div>
  );
}
