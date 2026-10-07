"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowsClockwise,
  CircleNotch,
  Eye,
  HardDrives,
  MagnifyingGlass,
  PaperPlaneTilt,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { RedisTelemetry, RedisKeyItem, RedisKeyDetail } from "@/shared/types/admin";
import {
  ConfirmDialog,
  EmptyState,
  FeedbackBanner,
  MetricCell,
  OpsButton,
  OpsCard,
  OpsSectionHeader,
  StatusPill,
} from "../components/admin-ui";

interface TelemetryTabProps {
  initialTelemetry: RedisTelemetry | null;
  getToken: () => Promise<string | null>;
  onRefresh: () => Promise<void>;
}

export function TelemetryTab({ initialTelemetry, getToken, onRefresh }: TelemetryTabProps) {
  const [telemetry, setTelemetry] = useState<RedisTelemetry | null>(initialTelemetry);
  const [pattern, setPattern] = useState("yomirra:*");
  const [keys, setKeys] = useState<RedisKeyItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedKeyDetail, setSelectedKeyDetail] = useState<RedisKeyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [opsActionLoading, setOpsActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (initialTelemetry) setTelemetry(initialTelemetry);
  }, [initialTelemetry]);

  const handleScanKeys = useCallback(async () => {
    if (!pattern.trim()) return;
    setScanning(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/redis/keys?pattern=${encodeURIComponent(pattern)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.keys) setKeys(data.keys);
      else setFeedback({ text: data.error || "Redis key scan gagal.", ok: false });
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat scan Redis.", ok: false });
    } finally {
      setScanning(false);
    }
  }, [getToken, pattern]);

  useEffect(() => {
    void handleScanKeys();
    // Initial explorer load intentionally follows the default pattern only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInspectKey = async (key: string) => {
    setLoadingDetail(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/redis/key-detail?key=${encodeURIComponent(key)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.detail) setSelectedKeyDetail(data.detail);
      else setFeedback({ text: data.error || "Detail key tidak dapat dibaca.", ok: false });
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat membaca key.", ok: false });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
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
        setFeedback({ text: data.message || `Key ${key} berhasil dihapus.`, ok: true });
        setKeys((current) => current.filter((item) => item.key !== key));
        if (selectedKeyDetail?.key === key) setSelectedKeyDetail(null);
        await onRefresh();
      } else {
        setFeedback({ text: data.error || "Redis key gagal dihapus.", ok: false });
      }
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat menghapus key.", ok: false });
    } finally {
      setDeletingKey(null);
      setPendingDeleteKey(null);
    }
  };

  const handleSendTelegramTest = async () => {
    setOpsActionLoading("test-telegram");
    setFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/ops/telegram-test", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setFeedback({ text: res.ok ? data.message || "Telegram test selesai." : data.error || "Telegram test gagal.", ok: res.ok && Boolean(data.delivered) });
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat menguji Telegram.", ok: false });
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setFeedback({ text: res.ok ? data.message || "Daily digest berhasil dipicu." : data.error || "Daily digest gagal dipicu.", ok: res.ok });
    } catch {
      setFeedback({ text: "Server tidak dapat dihubungi saat memicu digest.", ok: false });
    } finally {
      setOpsActionLoading(null);
    }
  };

  const connected = telemetry?.status === "connected";

  return (
    <div className="space-y-6">
      <OpsSectionHeader
        eyebrow="Runtime operations"
        title="Infrastructure"
        description="Redis telemetry, key explorer, dan kontrol ops messaging. Area ini menyentuh runtime state secara langsung."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsButton type="button" variant="secondary" onClick={() => void handleSendTelegramTest()} disabled={Boolean(opsActionLoading)}>
              {opsActionLoading === "test-telegram" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneTilt className="h-4 w-4" />}
              Test Telegram
            </OpsButton>
            <OpsButton type="button" variant="secondary" onClick={() => void handleTriggerDigest()} disabled={Boolean(opsActionLoading)}>
              {opsActionLoading === "digest-trigger" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowsClockwise className="h-4 w-4" />}
              Trigger digest
            </OpsButton>
          </div>
        }
      />

      {feedback ? <FeedbackBanner message={feedback.text} ok={feedback.ok} onDismiss={() => setFeedback(null)} /> : null}

      <OpsCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2"><HardDrives className="h-4 w-4 text-zinc-600" /><span className="text-xs font-medium text-zinc-300">Redis runtime</span></div>
          <StatusPill tone={connected ? "success" : "warning"} dot>{connected ? "Connected" : "Fallback / unavailable"}</StatusPill>
        </div>
        <div className="grid divide-y divide-zinc-800/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <MetricCell label="Memory used" value={telemetry?.usedMemory || "0B"} hint="Reported by Redis telemetry" />
          <MetricCell label="Uptime" value={`${telemetry?.uptimeDays || 0} hari`} hint="Runtime liveness" />
          <MetricCell label="Clients" value={telemetry?.connectedClients || 0} hint="Connected clients / instances" />
          <MetricCell label="Sampled keys" value={telemetry?.totalSampledKeys || 0} hint="Pattern yomirra:*" tone="brand" />
        </div>
        {!connected ? (
          <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-300">Penyelesaian status Redis Fallback / Unavailable:</p>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Instance saat ini tidak terhubung ke Redis terpusat dan beroperasi dengan in-memory fallback. Variabel lingkungan <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-200">REDIS_URL</code> belum disetel atau endpoint tidak dapat dihubungi.
                </p>
                <p className="text-[10px] text-zinc-500">
                  Langkah: Tambahkan connection string Redis (misal dari Upstash Redis / Redis Cloud: <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-zinc-300">rediss://default:token@host:port</code>) di Dashboard Vercel &rarr; Settings &rarr; Environment Variables, lalu redeploy.
                </p>
              </div>
              <OpsButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void onRefresh()}
                className="shrink-0"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" />
                Cek Ulang Koneksi
              </OpsButton>
            </div>
          </div>
        ) : null}
      </OpsCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <OpsCard className="overflow-hidden">
          <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
            <OpsSectionHeader eyebrow="Cache inspection" title="Redis Key Explorer" description="Scan key dengan pattern, inspeksi value, atau hapus key tertentu secara eksplisit." />
            <form
              onSubmit={(event) => { event.preventDefault(); void handleScanKeys(); }}
              className="mt-4 flex gap-2"
            >
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-700" />
                <input
                  type="text"
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value)}
                  placeholder="yomirra:*"
                  className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-8 pr-3 font-mono text-[11px] text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                />
              </div>
              <OpsButton type="submit" size="sm" variant="secondary" disabled={scanning || !pattern.trim()}>
                {scanning ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <MagnifyingGlass className="h-3.5 w-3.5" />}
                Scan
              </OpsButton>
            </form>
          </div>

          {keys.length === 0 ? (
            <EmptyState icon={<HardDrives className="h-5 w-5" />} title="Tidak ada key yang cocok" description={`Pattern saat ini: ${pattern}`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] table-fixed text-left">
                <thead className="border-b border-zinc-800/80 bg-zinc-950/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                  <tr><th className="w-[60%] px-5 py-2.5">Key</th><th className="w-[14%] px-3 py-2.5">Type</th><th className="w-[14%] px-3 py-2.5">TTL</th><th className="w-[12%] px-5 py-2.5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {keys.map((item) => (
                    <tr key={item.key} className="hover:bg-zinc-900/55">
                      <td className="px-5 py-3 font-mono text-[11px] text-zinc-400"><div className="truncate">{item.key}</div></td>
                      <td className="px-3 py-3"><StatusPill tone="neutral" className="font-mono">{item.type}</StatusPill></td>
                      <td className="px-3 py-3 font-mono text-[11px] text-zinc-600">{item.ttl === -1 ? "persist" : `${item.ttl}s`}</td>
                      <td className="px-5 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => void handleInspectKey(item.key)} disabled={loadingDetail} className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200" title="Inspect key"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => setPendingDeleteKey(item.key)} disabled={deletingKey === item.key} className="rounded-lg p-1.5 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-300" title="Delete key">{deletingKey === item.key ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OpsCard>

        <OpsCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-4 sm:px-5">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400/90">Inspector</p><h3 className="mt-1 text-sm font-medium text-zinc-200">Key detail</h3></div>
            {selectedKeyDetail ? <button type="button" onClick={() => setSelectedKeyDetail(null)} className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-200" aria-label="Tutup key detail"><X className="h-4 w-4" /></button> : null}
          </div>

          {selectedKeyDetail ? (
            <div className="p-4 sm:p-5">
              <p className="break-all font-mono text-[11px] leading-5 text-zinc-400">{selectedKeyDetail.key}</p>
              <pre className="mt-3 max-h-[430px] overflow-auto whitespace-pre-wrap break-all rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 font-mono text-[10px] leading-5 text-zinc-400">{selectedKeyDetail.value}</pre>
            </div>
          ) : (
            <EmptyState icon={<Eye className="h-5 w-5" />} title="Pilih key untuk inspeksi" description="Isi key hanya dimuat ketika operator memilih Inspect pada tabel." />
          )}
        </OpsCard>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteKey)}
        title="Hapus Redis key?"
        description={pendingDeleteKey ? `Key “${pendingDeleteKey}” akan dihapus permanen dari Redis.` : "Key akan dihapus permanen dari Redis."}
        confirmLabel="Hapus key"
        danger
        busy={Boolean(deletingKey)}
        onClose={() => setPendingDeleteKey(null)}
        onConfirm={() => { if (pendingDeleteKey) void handleDeleteKey(pendingDeleteKey); }}
      />
    </div>
  );
}
