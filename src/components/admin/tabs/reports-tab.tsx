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
  WarningCircle
} from "@phosphor-icons/react";
import type { UserReport } from "@/server/lib/ops/admin-report-service";

interface ReportsTabProps {
  reports: UserReport[];
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function ReportsTab({ reports, onRefresh, getToken }: ReportsTabProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

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
        setFeedback({ text: `Status laporan diubah ke ${status}`, ok: true });
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

  const handleReportAction = async (reportId: string, sourceId?: string, action: "flush_source_cache" | "probe_source" = "probe_source") => {
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

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-400" />
            Inbox Laporan Pengguna ({reports.length})
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Keluhan gambar rusak, halaman acak, atau chapter bermasalah langsung dari reader.
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
          className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
            feedback.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {feedback.ok ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <WarningCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-xl">
          <p className="text-zinc-400 text-xs">Tidak ada laporan dengan filter `{filter}`.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      report.status === "pending"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : report.status === "resolved"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {report.status}
                  </span>
                  <span className="font-semibold text-zinc-100 text-sm">
                    {report.mangaId || report.sourceId || "Manga"}
                  </span>
                  {report.chapterTitle && (
                    <span className="text-xs text-zinc-400">{report.chapterTitle}</span>
                  )}
                  {report.sourceId && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                      {report.sourceId}
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-300 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
                  <p>
                    <b className="text-zinc-400">Kategori:</b> {report.category || report.type}
                  </p>
                  {report.detail && (
                    <p className="mt-1 text-zinc-400">
                      <b className="text-zinc-500">Detail:</b> {report.detail}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-zinc-500 font-mono">
                  ID: {report.id} · Dilaporkan: {new Date(report.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {report.chapterId && report.sourceId && (
                  <a
                    href={`/reader/${report.sourceId}/${encodeURIComponent(report.chapterId)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                    title="Buka chapter di reader"
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
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg transition"
                      title="Flush cache source ini"
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
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg transition"
                      title="Live probe source adapter terkait"
                    >
                      {actionLoadingId === `${report.id}-probe_source` ? (
                        <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Lightning className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      Probe
                    </button>
                  </>
                )}

                {report.status !== "resolved" && (
                  <button
                    onClick={() => handleUpdateStatus(report.id, "resolved")}
                    disabled={!!actionLoadingId}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                  >
                    {actionLoadingId === `${report.id}-resolved` ? (
                      <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
