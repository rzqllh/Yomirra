"use client";

import React, { useState } from "react";
import {
  Flag,
  ArrowSquareOut,
  Trash,
  Lightning,
  Check,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  BookOpen,
  Image,
  Question,
  Wrench,
  Clock,
  MagnifyingGlass,
  SealCheck,
  Hash,
} from "@phosphor-icons/react";
import type { UserReport } from "@/server/lib/ops/admin-report-service";

interface ReportsTabProps {
  reports: UserReport[];
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  chapter_error: {
    label: "Chapter Error",
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  image_broken: {
    label: "Gambar Rusak",
    icon: <Image className="w-4 h-4" />,
    color: "text-red-400 bg-red-500/10 border-red-500/30",
  },
  source_broken: {
    label: "Source Bermasalah",
    icon: <Wrench className="w-4 h-4" />,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  },
  other: {
    label: "Lainnya",
    icon: <Question className="w-4 h-4" />,
    color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  investigating: {
    label: "Investigating",
    icon: <MagnifyingGlass className="w-3.5 h-3.5" />,
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  resolved: {
    label: "Resolved",
    icon: <SealCheck className="w-3.5 h-3.5" />,
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

function TicketId({ id }: { id: string }) {
  // Extract short ticket number from rep_TIMESTAMP_RAND
  const short = id.replace("rep_", "").split("_").pop()?.toUpperCase() ?? id.slice(-5).toUpperCase();
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
      <Hash className="w-3 h-3" />
      {short}
    </span>
  );
}

export function ReportsTab({ reports, onRefresh, getToken }: ReportsTabProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReports = reports.filter((r) => {
    if (filter === "ALL") return true;
    return r.status.toLowerCase() === filter.toLowerCase();
  });

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
        setFeedback({ text: `Tiket #${reportId.slice(-5).toUpperCase()} diupdate ke ${status}`, ok: true });
        await onRefresh();
      } else {
        setFeedback({ text: data.error || "Gagal mengubah status", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal menghubungkan ke server", ok: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReportAction = async (
    reportId: string,
    sourceId?: string,
    action: "flush_source_cache" | "probe_source" = "probe_source"
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
        setFeedback({ text: data.message || "Tindakan berhasil dieksekusi", ok: true });
        await onRefresh();
      } else {
        setFeedback({ text: data.error || "Gagal mengeksekusi tindakan", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal menghubungkan ke server", ok: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-400" />
            Inbox Laporan Pengguna
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                {pendingCount} baru
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Tiket masuk dari reader — gambar rusak, chapter error, atau source bermasalah.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
          {["ALL", "pending", "investigating", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium uppercase transition ${
                filter === status
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
            feedback.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {feedback.ok ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <WarningCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Ticket List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-xl">
          <Flag className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm font-medium">Tidak ada tiket</p>
          <p className="text-zinc-600 text-xs mt-1">Filter: {filter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const typeConf = TYPE_CONFIG[report.type] ?? TYPE_CONFIG.other;
            const statusConf = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
            const isExpanded = expandedId === report.id;

            return (
              <div
                key={report.id}
                className={`bg-zinc-900/60 border rounded-xl overflow-hidden transition-all ${
                  report.status === "resolved"
                    ? "border-zinc-800/50 opacity-70"
                    : report.status === "investigating"
                      ? "border-blue-500/20"
                      : "border-zinc-800"
                }`}
              >
                {/* Ticket Header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-zinc-800/20 transition"
                >
                  {/* Type icon pill */}
                  <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border ${typeConf.color}`}>
                    {typeConf.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConf.badge}`}>
                        {statusConf.icon}
                        {statusConf.label}
                      </span>

                      {/* Type label */}
                      <span className="text-xs font-semibold text-zinc-200">
                        {typeConf.label}
                      </span>

                      {/* Source badge */}
                      {report.sourceId && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                          {report.sourceId}
                        </span>
                      )}
                    </div>

                    {/* Manga title or ID */}
                    <p className="text-sm font-semibold text-zinc-100 truncate">
                      {report.mangaTitle || report.mangaId || "—"}
                    </p>

                    {/* Chapter if available */}
                    {report.chapterTitle && (
                      <p className="text-xs text-zinc-400 truncate">{report.chapterTitle}</p>
                    )}
                  </div>

                  {/* Right: ticket ID + time */}
                  <div className="shrink-0 text-right space-y-1">
                    <TicketId id={report.id} />
                    <p className="text-[10px] text-zinc-500">
                      {new Date(report.createdAt).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </p>
                  </div>
                </button>

                {/* Expanded detail body */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/60 px-4 pb-4 pt-3 space-y-4">
                    {/* Detail block */}
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/60">
                          <p className="text-zinc-500 mb-0.5">Kategori</p>
                          <p className="text-zinc-200 font-medium">{report.category || report.type}</p>
                        </div>
                        {report.sourceId && (
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/60">
                            <p className="text-zinc-500 mb-0.5">Source</p>
                            <p className="text-zinc-200 font-mono uppercase">{report.sourceId}</p>
                          </div>
                        )}
                        {typeof report.pageIndex === "number" && (
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/60">
                            <p className="text-zinc-500 mb-0.5">Halaman</p>
                            <p className="text-zinc-200 font-medium">#{report.pageIndex + 1}</p>
                          </div>
                        )}
                        {report.resolvedAt && (
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/60">
                            <p className="text-zinc-500 mb-0.5">Diselesaikan</p>
                            <p className="text-zinc-200 font-medium">
                              {new Date(report.resolvedAt).toLocaleString("id-ID", {
                                timeZone: "Asia/Jakarta",
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })} WIB
                            </p>
                          </div>
                        )}
                      </div>

                      {report.detail && (
                        <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/60">
                          <p className="text-zinc-500 mb-1 text-[10px] uppercase tracking-wide">Catatan dari pengguna</p>
                          <p className="text-zinc-300 leading-relaxed">{report.detail}</p>
                        </div>
                      )}

                      {/* Technical IDs */}
                      <div className="text-[10px] text-zinc-600 font-mono space-y-0.5 pt-1">
                        <p>Tiket ID: {report.id}</p>
                        {report.mangaId && <p>Manga ID: {report.mangaId}</p>}
                        {report.chapterId && <p>Chapter ID: {report.chapterId}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40">
                      {report.chapterId && report.sourceId && (
                        <a
                          href={`/reader/${report.sourceId}/${encodeURIComponent(report.chapterId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                        >
                          <ArrowSquareOut className="w-3.5 h-3.5 text-zinc-400" />
                          Inspeksi Reader
                        </a>
                      )}

                      {report.sourceId && (
                        <>
                          <button
                            onClick={() => handleReportAction(report.id, report.sourceId, "flush_source_cache")}
                            disabled={!!actionLoadingId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg transition"
                          >
                            {actionLoadingId === `${report.id}-flush_source_cache` ? (
                              <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash className="w-3.5 h-3.5 text-red-400" />
                            )}
                            Flush Cache
                          </button>

                          <button
                            onClick={() => handleReportAction(report.id, report.sourceId, "probe_source")}
                            disabled={!!actionLoadingId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg transition"
                          >
                            {actionLoadingId === `${report.id}-probe_source` ? (
                              <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Lightning className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            Probe Source
                          </button>
                        </>
                      )}

                      <div className="ml-auto flex gap-2">
                        {report.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, "investigating")}
                            disabled={!!actionLoadingId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                          >
                            {actionLoadingId === `${report.id}-investigating` ? (
                              <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MagnifyingGlass className="w-3.5 h-3.5" />
                            )}
                            Investigasi
                          </button>
                        )}

                        {report.status !== "resolved" && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, "resolved")}
                            disabled={!!actionLoadingId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                          >
                            {actionLoadingId === `${report.id}-resolved` ? (
                              <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Selesaikan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
