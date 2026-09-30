"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Heartbeat, 
  Trash, 
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Globe,
  Lightning,
  Plus,
  PencilSimple,
  SlidersHorizontal
} from "@phosphor-icons/react";
import type { SourceHealthMatrixItem } from "@/server/lib/sources/admin-source-service";
import type { CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import { CustomSourceModal } from "../sources/custom-source-modal";
import { CoreSourceModal } from "../sources/core-source-modal";

interface SourcesTabProps {
  sources: SourceHealthMatrixItem[];
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function SourcesTab({ sources, onRefresh, getToken }: SourcesTabProps) {
  const [probingId, setProbingId] = useState<string | null>(null);
  const [flushingId, setFlushingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Core sources dynamic edit state
  const [editingCoreSource, setEditingCoreSource] = useState<SourceHealthMatrixItem | null>(null);
  const [coreModalOpen, setCoreModalOpen] = useState(false);

  // Custom sources state
  const [customSources, setCustomSources] = useState<CustomSourceDefinition[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CustomSourceDefinition | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCustomSources = useCallback(async () => {
    setLoadingCustom(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sources/custom", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.sources) {
        setCustomSources(data.sources);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingCustom(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCustomSources();
  }, [fetchCustomSources]);

  const handleProbe = async (sourceId?: string) => {
    setProbingId(sourceId || "ALL");
    setStatusMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sources/probe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          text: sourceId
            ? `Probe ${sourceId} selesai: ${data.probe?.status || "OK"} (${data.probe?.latencyMs || 0}ms)`
            : `Probe seluruh source selesai`,
          ok: true,
        });
        await onRefresh();
      } else {
        setStatusMessage({ text: data.error || "Gagal melakukan probe", ok: false });
      }
    } catch {
      setStatusMessage({ text: "Gagal menghubungkan ke server probe", ok: false });
    } finally {
      setProbingId(null);
    }
  };

  const handleFlush = async (sourceId?: string) => {
    const confirmMsg = sourceId
      ? `Bersihkan cache Redis untuk source ${sourceId}?`
      : "Bersihkan cache Redis seluruh source?";
    if (!confirm(confirmMsg)) return;

    setFlushingId(sourceId || "ALL");
    setStatusMessage(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sources/flush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sourceId ? { sourceId } : { flushAll: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ text: data.message || "Cache berhasil dibersihkan", ok: true });
        await onRefresh();
      } else {
        setStatusMessage({ text: data.error || "Gagal membersihkan cache", ok: false });
      }
    } catch {
      setStatusMessage({ text: "Gagal menghubungkan ke server flush", ok: false });
    } finally {
      setFlushingId(null);
    }
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    if (!confirm(`Hapus custom source '${name}' (${id}) secara permanen?`)) return;
    setDeletingId(id);
    setStatusMessage(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/sources/custom?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: `Source '${name}' berhasil dihapus`, ok: true });
        await fetchCustomSources();
        await onRefresh();
      } else {
        setStatusMessage({ text: data.error || "Gagal menghapus source", ok: false });
      }
    } catch {
      setStatusMessage({ text: "Gagal menghubungi server", ok: false });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">● Normal</span>;
      case "DEGRADED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">▲ Terdegradasi</span>;
      case "DOWN":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">✖ Gangguan</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">○ Belum Terukur</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Global Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Heartbeat className="w-5 h-5 text-emerald-400" />
            Manajemen Sumber Manga (Core & Kustom)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau kesehatan adapter bawaan, live probe, serta tambahkan / perbaiki sumber kustom secara dinamis tanpa deploy ulang.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingSource(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Sumber Baru
          </button>
          <button
            onClick={() => handleProbe()}
            disabled={!!probingId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition"
          >
            {probingId === "ALL" ? (
              <CircleNotch className="w-4 h-4 animate-spin" />
            ) : (
              <Lightning className="w-4 h-4" />
            )}
            Probe All
          </button>
          <button
            onClick={() => handleFlush()}
            disabled={!!flushingId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-xl transition"
          >
            {flushingId === "ALL" ? (
              <CircleNotch className="w-4 h-4 animate-spin text-red-400" />
            ) : (
              <Trash className="w-4 h-4 text-red-400" />
            )}
            Flush All
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
            statusMessage.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {statusMessage.ok ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <WarningCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: Dynamic Custom Sources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            Sumber Dinamis Kustom ({customSources.length})
          </h3>
          <span className="text-[11px] text-zinc-500">
            Dikelola via Redis, tanpa redeploy kode
          </span>
        </div>

        {loadingCustom && customSources.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-zinc-400 text-xs">
            <CircleNotch className="w-4 h-4 animate-spin text-purple-400" />
            Memuat daftar sumber dinamis...
          </div>
        ) : customSources.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl space-y-2">
            <p className="text-xs text-zinc-400">Belum ada sumber dinamis kustom yang ditambahkan.</p>
            <button
              onClick={() => {
                setEditingSource(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Buka Studio Tambah Sumber
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customSources.map((custom) => (
              <div
                key={custom.id}
                className="p-4 bg-zinc-900/70 border border-purple-500/30 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                        {custom.name}
                        {custom.isNsfw && (
                          <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-bold">18+</span>
                        )}
                      </h4>
                      <span className="text-[10px] font-mono text-purple-400 uppercase">
                        {custom.id} · {custom.type.toUpperCase()} · {custom.lang.toUpperCase()}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${custom.isEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                      {custom.isEnabled ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-zinc-400 truncate mb-3 bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    {custom.baseUrl}
                  </p>

                  {custom.mirrors.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Mirrors:</span>
                      <div className="flex flex-wrap gap-1">
                        {custom.mirrors.map((m, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setEditingSource(custom);
                      setModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                  >
                    <PencilSimple className="w-3.5 h-3.5 text-purple-400" />
                    Edit & Perbaiki
                  </button>
                  <button
                    onClick={() => handleDeleteCustom(custom.id, custom.name)}
                    disabled={deletingId === custom.id}
                    className="p-1.5 bg-zinc-800 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-xs rounded-lg transition"
                    title="Hapus sumber ini"
                  >
                    {deletingId === custom.id ? (
                      <CircleNotch className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Trash className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Core Built-in Sources Matrix */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Heartbeat className="w-4 h-4 text-emerald-400" />
          Core Built-in Source Engine (7 Adapter Bawaan)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{item.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.id}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Latency & Last Checked */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-zinc-950/60 rounded-lg text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Latency</span>
                    <span className="font-mono font-medium text-zinc-300">
                      {item.latencyMs > 0 ? `${item.latencyMs} ms` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Terakhir Cek</span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {item.lastCheckedAt
                        ? new Date(item.lastCheckedAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Belum pernah"}
                    </span>
                  </div>
                </div>

                {/* Active Domain */}
                <div className="mb-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Domain / URL Aktif:</span>
                  <p className="text-xs font-mono text-zinc-300 truncate bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    {item.activeDomain || item.upstreamDomain}
                  </p>
                </div>

                {/* Mirror domains */}
                <div className="space-y-1 mb-4">
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase font-semibold">
                    <Globe className="w-3 h-3" /> Mirror Domains ({item.mirrors.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.mirrors.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions for this source */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/60">
                <button
                  onClick={() => {
                    setEditingCoreSource(item);
                    setCoreModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-lg transition"
                  title="Ubah domain aktif & status bawaan secara dinamis"
                >
                  <PencilSimple className="w-3.5 h-3.5" />
                  Ubah Domain
                </button>

                <button
                  onClick={() => handleProbe(item.id)}
                  disabled={probingId === item.id}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg transition flex items-center gap-1"
                >
                  {probingId === item.id ? (
                    <CircleNotch className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Lightning className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  Probe
                </button>

                <button
                  onClick={() => handleFlush(item.id)}
                  disabled={flushingId === item.id}
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 disabled:opacity-50 text-xs font-medium rounded-lg transition"
                  title={`Flush cache untuk ${item.id}`}
                >
                  {flushingId === item.id ? (
                    <CircleNotch className="w-3.5 h-3.5 animate-spin text-red-400" />
                  ) : (
                    <Trash className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Source Dynamic Override Modal */}
      <CoreSourceModal
        isOpen={coreModalOpen}
        source={editingCoreSource}
        onClose={() => {
          setCoreModalOpen(false);
          setEditingCoreSource(null);
        }}
        onSaved={onRefresh}
        getToken={getToken}
      />

      {/* Custom Source Studio Modal */}
      <CustomSourceModal
        isOpen={modalOpen}
        initialSource={editingSource}
        onClose={() => {
          setModalOpen(false);
          setEditingSource(null);
        }}
        onSaved={async () => {
          await fetchCustomSources();
          await onRefresh();
        }}
        getToken={getToken}
      />
    </div>
  );
}
