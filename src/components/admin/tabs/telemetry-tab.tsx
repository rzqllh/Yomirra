"use client";

import React, { useState, useEffect } from "react";
import { 
  HardDrives, 
  MagnifyingGlass, 
  Trash, 
  Eye, 
  PaperPlaneTilt, 
  CircleNotch,
  CheckCircle,
  WarningCircle,
  ArrowsClockwise,
  X
} from "@phosphor-icons/react";
import type { RedisTelemetry, RedisKeyItem, RedisKeyDetail } from "@/server/lib/cache/admin-redis-service";

interface TelemetryTabProps {
  initialTelemetry: RedisTelemetry | null;
  getToken: () => Promise<string | null>;
  onRefresh: () => Promise<void>;
}

export function TelemetryTab({ initialTelemetry, getToken, onRefresh }: TelemetryTabProps) {
  const [telemetry, setTelemetry] = useState<RedisTelemetry | null>(initialTelemetry);
  const [loadingTelem, setLoadingTelem] = useState(false);

  // Key explorer
  const [pattern, setPattern] = useState("yomirra:*");
  const [keys, setKeys] = useState<RedisKeyItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedKeyDetail, setSelectedKeyDetail] = useState<RedisKeyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Ops telegram actions
  const [opsActionLoading, setOpsActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (initialTelemetry) {
      setTelemetry(initialTelemetry);
    }
  }, [initialTelemetry]);

  const handleScanKeys = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setScanning(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/redis/keys?pattern=${encodeURIComponent(pattern)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.keys) {
        setKeys(data.keys);
      } else {
        setFeedback({ text: data.error || "Gagal scan keys Redis", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal menghubungkan ke server", ok: false });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    handleScanKeys();
  }, []);

  const handleInspectKey = async (key: string) => {
    setLoadingDetail(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/redis/key-detail?key=${encodeURIComponent(key)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.detail) {
        setSelectedKeyDetail(data.detail);
      } else {
        setFeedback({ text: data.error || "Gagal membaca detail key", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal mengambil data key", ok: false });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm(`Hapus key Redis '${key}' secara permanen?`)) return;
    setDeletingKey(key);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/redis/keys", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: data.message || `Key ${key} berhasil dihapus`, ok: true });
        setKeys(keys.filter((k) => k.key !== key));
        if (selectedKeyDetail?.key === key) {
          setSelectedKeyDetail(null);
        }
      } else {
        setFeedback({ text: data.error || "Gagal menghapus key", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal menghubungi server", ok: false });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSendTelegramTest = async () => {
    setOpsActionLoading("test-telegram");
    setFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/ops/telegram-test", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message, ok: data.delivered });
      } else {
        setFeedback({ text: data.error || "Gagal mengirim test notifikasi", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal menghubungi server", ok: false });
    } finally {
      setOpsActionLoading(null);
    }
  };

  const handleTriggerDigest = async () => {
    setOpsActionLoading("digest-trigger");
    setFeedback(null);
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
        setFeedback({ text: data.message, ok: true });
      } else {
        setFeedback({ text: data.error || "Gagal memicu daily digest", ok: false });
      }
    } catch {
      setFeedback({ text: "Gagal menghubungi server", ok: false });
    } finally {
      setOpsActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <HardDrives className="w-5 h-5 text-cyan-400" />
            Telemetri Sistem & Redis Key Explorer
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau performa penyimpanan in-memory Redis, jelajahi isi key aplikasi, dan kendalikan bot Telegram.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTelegramTest}
            disabled={!!opsActionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-xl transition"
          >
            {opsActionLoading === "test-telegram" ? (
              <CircleNotch className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <PaperPlaneTilt className="w-4 h-4 text-cyan-400" />
            )}
            Test Bot Telegram
          </button>
          <button
            onClick={handleTriggerDigest}
            disabled={!!opsActionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-xl transition"
          >
            {opsActionLoading === "digest-trigger" ? (
              <CircleNotch className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <ArrowsClockwise className="w-4 h-4 text-purple-400" />
            )}
            Kirim Daily Digest
          </button>
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

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Memori Terpakai</span>
          <span className="text-xl font-bold text-zinc-100">{telemetry?.usedMemory || "0B"}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">ioredis metrics</span>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Uptime Redis</span>
          <span className="text-xl font-bold text-zinc-100">{telemetry?.uptimeDays || 0} Hari</span>
          <span className="text-[11px] text-zinc-500 block mt-1">Server liveness</span>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Koneksi Klien</span>
          <span className="text-xl font-bold text-zinc-100">{telemetry?.connectedClients || 0}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">Active instances</span>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Key Yomirra</span>
          <span className="text-xl font-bold text-zinc-100">{telemetry?.totalSampledKeys || 0}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">Pattern yomirra:*</span>
        </div>
      </div>

      {/* Redis Key Explorer Box */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <MagnifyingGlass className="w-4 h-4 text-cyan-400" />
          Redis Key Explorer
        </h3>

        <form onSubmit={handleScanKeys} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Pola pencarian (contoh: yomirra:*, yomirra:site:*, yomirra:search:*)..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !pattern.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 text-xs font-medium rounded-xl transition"
          >
            {scanning ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Scan Keys"}
          </button>
        </form>

        {/* Keys List */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <div className="bg-zinc-950/80 px-3 py-2 text-[11px] font-semibold text-zinc-400 grid grid-cols-12 border-b border-zinc-800">
            <div className="col-span-7">Key Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">TTL</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          {keys.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              Tidak ada key yang cocok dengan pola `{pattern}`.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 max-h-80 overflow-y-auto">
              {keys.map((item) => (
                <div
                  key={item.key}
                  className="px-3 py-2 text-xs grid grid-cols-12 items-center hover:bg-zinc-850/40"
                >
                  <div className="col-span-7 font-mono text-zinc-200 truncate pr-2">
                    {item.key}
                  </div>
                  <div className="col-span-2 font-mono text-zinc-400 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {item.type}
                    </span>
                  </div>
                  <div className="col-span-1 font-mono text-zinc-400 text-[11px]">
                    {item.ttl === -1 ? "persist" : `${item.ttl}s`}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleInspectKey(item.key)}
                      disabled={loadingDetail}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                      title="Lihat isi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(item.key)}
                      disabled={deletingKey === item.key}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400"
                      title="Hapus key"
                    >
                      {deletingKey === item.key ? (
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

        {/* Modal / Inspector Box if selected */}
        {selectedKeyDetail && (
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 font-mono truncate">
                {selectedKeyDetail.key}
              </span>
              <button
                onClick={() => setSelectedKeyDetail(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-3 bg-zinc-900 rounded-lg text-[11px] font-mono text-zinc-300 max-h-60 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all border border-zinc-800">
              {selectedKeyDetail.value}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
