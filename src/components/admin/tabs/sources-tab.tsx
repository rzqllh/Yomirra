"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowSquareOut,
  CircleNotch,
  Globe,
  Heartbeat,
  Lightning,
  PencilSimple,
  Plus,
  SlidersHorizontal,
  Trash,
} from "@phosphor-icons/react";
import type { SourceHealthMatrixItem } from "@/shared/types/admin";
import type { CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import { CustomSourceModal } from "../sources/custom-source-modal";
import { CoreSourceModal } from "../sources/core-source-modal";
import {
  ConfirmDialog,
  EmptyState,
  FeedbackBanner,
  MetricCell,
  OpsButton,
  OpsCard,
  OpsSectionHeader,
  StatusPill,
  cx,
} from "../components/admin-ui";

interface SourcesTabProps {
  sources: SourceHealthMatrixItem[];
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

type PendingConfirm =
  | { type: "flush-all" }
  | { type: "flush-one"; id: string; name: string }
  | { type: "delete-custom"; id: string; name: string }
  | null;

function sourceTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "HEALTHY") return "success";
  if (status === "DEGRADED") return "warning";
  if (status === "DOWN") return "danger";
  return "neutral";
}

function sourceLabel(status: string) {
  if (status === "HEALTHY") return "Healthy";
  if (status === "DEGRADED") return "Degraded";
  if (status === "DOWN") return "Down";
  return "Unknown";
}

function formatChecked(value?: string | null) {
  if (!value) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function SourcesTab({ sources, onRefresh, getToken }: SourcesTabProps) {
  const [probingId, setProbingId] = useState<string | null>(null);
  const [flushingId, setFlushingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [editingCoreSource, setEditingCoreSource] = useState<SourceHealthMatrixItem | null>(null);
  const [coreModalOpen, setCoreModalOpen] = useState(false);

  const [customSources, setCustomSources] = useState<CustomSourceDefinition[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CustomSourceDefinition | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const fetchCustomSources = useCallback(async () => {
    setLoadingCustom(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sources/custom", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.sources) setCustomSources(data.sources);
    } catch {
      setStatusMessage({ text: "Custom source tidak dapat dimuat dari server.", ok: false });
    } finally {
      setLoadingCustom(false);
    }
  }, [getToken]);

  useEffect(() => {
    void fetchCustomSources();
  }, [fetchCustomSources]);

  const healthyCount = sources.filter((source) => source.status === "HEALTHY" && source.isEnabled).length;
  const enabledCount = sources.filter((source) => source.isEnabled).length;
  const degradedCount = sources.filter((source) => source.isEnabled && source.status === "DEGRADED").length;
  const downCount = sources.filter((source) => source.isEnabled && source.status === "DOWN").length;

  const sortedSources = useMemo(
    () =>
      [...sources].sort((a, b) => {
        const rank: Record<string, number> = { DOWN: 0, DEGRADED: 1, UNKNOWN: 2, HEALTHY: 3 };
        const aRank = a.isEnabled ? rank[a.status] ?? 2 : 4;
        const bRank = b.isEnabled ? rank[b.status] ?? 2 : 4;
        return aRank - bRank || a.name.localeCompare(b.name);
      }),
    [sources],
  );

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
        const text = sourceId
          ? data.probe
            ? `${sourceId}: ${data.probe.success ? "healthy" : "probe gagal"} · ${data.probe.latencyMs ?? 0} ms${data.probe.message ? ` · ${data.probe.message}` : ""}`
            : `Probe ${sourceId} selesai.`
          : data.summary
            ? `Probe selesai: ${data.summary.success}/${data.summary.total} healthy${data.summary.failed ? `, ${data.summary.failed} gagal` : ""}.`
            : "Probe seluruh source selesai.";
        setStatusMessage({ text, ok: sourceId ? Boolean(data.probe?.success ?? true) : (data.summary?.failed ?? 0) === 0 });
        await onRefresh();
      } else {
        setStatusMessage({ text: data.error || "Probe source gagal.", ok: false });
      }
    } catch {
      setStatusMessage({ text: "Server probe tidak dapat dihubungi.", ok: false });
    } finally {
      setProbingId(null);
    }
  };

  const handleFlush = async (sourceId?: string) => {
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
        setStatusMessage({ text: data.message || "Cache source berhasil dibersihkan.", ok: true });
        await onRefresh();
      } else {
        setStatusMessage({ text: data.error || "Gagal membersihkan cache source.", ok: false });
      }
    } catch {
      setStatusMessage({ text: "Server tidak dapat dihubungi saat membersihkan cache.", ok: false });
    } finally {
      setFlushingId(null);
      setPendingConfirm(null);
    }
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    setDeletingId(id);
    setStatusMessage(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/sources/custom?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: `Custom source “${name}” berhasil dihapus.`, ok: true });
        await fetchCustomSources();
        await onRefresh();
      } else {
        setStatusMessage({ text: data.error || "Gagal menghapus custom source.", ok: false });
      }
    } catch {
      setStatusMessage({ text: "Server tidak dapat dihubungi saat menghapus source.", ok: false });
    } finally {
      setDeletingId(null);
      setPendingConfirm(null);
    }
  };

  const openCustomEditor = (source: CustomSourceDefinition | null) => {
    setEditingSource(source);
    setModalOpen(true);
  };

  const openCoreEditor = (source: SourceHealthMatrixItem) => {
    setEditingCoreSource(source);
    setCoreModalOpen(true);
  };

  const confirmBusy =
    pendingConfirm?.type === "delete-custom"
      ? deletingId === pendingConfirm.id
      : pendingConfirm?.type === "flush-one"
        ? flushingId === pendingConfirm.id
        : pendingConfirm?.type === "flush-all"
          ? flushingId === "ALL"
          : false;

  return (
    <div className="space-y-6">
      <OpsSectionHeader
        eyebrow="Discovery infrastructure"
        title="Source Health"
        description="Pantau adapter bawaan, domain aktif, latency, probe, cache, dan source kustom dari satu permukaan operasional."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <OpsButton type="button" variant="secondary" onClick={() => void handleProbe()} disabled={Boolean(probingId)}>
              {probingId === "ALL" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Lightning className="h-4 w-4" />}
              Probe all
            </OpsButton>
            <OpsButton type="button" variant="primary" onClick={() => openCustomEditor(null)}>
              <Plus className="h-4 w-4" />
              Tambah source
            </OpsButton>
          </div>
        }
      />

      {statusMessage ? (
        <FeedbackBanner message={statusMessage.text} ok={statusMessage.ok} onDismiss={() => setStatusMessage(null)} />
      ) : null}

      <OpsCard className="overflow-hidden">
        <div className="grid divide-y divide-zinc-800/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <MetricCell label="Healthy" value={`${healthyCount}/${enabledCount || 0}`} hint={`${sources.length} core source terdaftar`} tone={healthyCount === enabledCount ? "success" : "warning"} />
          <MetricCell label="Degraded" value={degradedCount} hint="Masih merespons, tetapi perlu inspeksi" tone={degradedCount ? "warning" : "neutral"} />
          <MetricCell label="Down" value={downCount} hint="Source aktif yang gagal health check" tone={downCount ? "danger" : "neutral"} />
          <MetricCell label="Custom" value={customSources.length} hint="Konfigurasi dinamis tanpa redeploy" tone="brand" />
        </div>
      </OpsCard>

      <OpsCard className="overflow-hidden">
        <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
          <OpsSectionHeader
            eyebrow="Built-in adapters"
            title="Core source matrix"
            description="Source bermasalah diprioritaskan di atas agar triage lebih cepat."
            action={
              <OpsButton type="button" variant="danger" size="sm" onClick={() => setPendingConfirm({ type: "flush-all" })} disabled={Boolean(flushingId)}>
                {flushingId === "ALL" ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                Flush all cache
              </OpsButton>
            }
          />
        </div>

        {sources.length === 0 ? (
          <EmptyState icon={<Heartbeat className="h-5 w-5" />} title="Belum ada source" description="Data source belum tersedia dari admin API." />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] table-fixed text-left">
                <thead className="border-b border-zinc-800/80 bg-zinc-950/40 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
                  <tr>
                    <th className="w-[24%] px-5 py-2.5">Source</th>
                    <th className="w-[14%] px-4 py-2.5">State</th>
                    <th className="w-[11%] px-4 py-2.5">Latency</th>
                    <th className="w-[25%] px-4 py-2.5">Active domain</th>
                    <th className="w-[14%] px-4 py-2.5">Last check</th>
                    <th className="w-[12%] px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {sortedSources.map((source) => (
                    <tr key={source.id} className={cx("group transition-colors hover:bg-zinc-900/65", !source.isEnabled && "opacity-55")}>
                      <td className="px-5 py-3.5 align-middle">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-medium text-zinc-200">{source.name}</span>
                            {!source.isEnabled ? <StatusPill tone="neutral">Disabled</StatusPill> : null}
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[10px] uppercase text-zinc-700">{source.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><StatusPill tone={sourceTone(source.status)} dot>{sourceLabel(source.status)}</StatusPill></td>
                      <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-zinc-400">{source.latencyMs > 0 ? `${source.latencyMs} ms` : "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
                          <span className="truncate font-mono text-[11px] text-zinc-400">{source.activeDomain || source.upstreamDomain || "—"}</span>
                        </div>
                        {(source.mirrors?.length ?? 0) > 0 ? <p className="mt-0.5 text-[10px] text-zinc-700">{source.mirrors.length} mirror</p> : null}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-zinc-600">{formatChecked(source.lastCheckedAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openCoreEditor(source)} className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200" title="Edit source"><PencilSimple className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void handleProbe(source.id)} disabled={probingId === source.id} className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-emerald-300 disabled:opacity-40" title="Probe source">
                            {probingId === source.id ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Lightning className="h-4 w-4" />}
                          </button>
                          <button type="button" onClick={() => setPendingConfirm({ type: "flush-one", id: source.id, name: source.name })} disabled={flushingId === source.id} className="rounded-lg p-1.5 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40" title="Flush source cache">
                            {flushingId === source.id ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-800/80 lg:hidden">
              {sortedSources.map((source) => (
                <div key={source.id} className={cx("p-4", !source.isEnabled && "opacity-55")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-zinc-200">{source.name}</p>
                        <StatusPill tone={sourceTone(source.status)} dot>{sourceLabel(source.status)}</StatusPill>
                        {!source.isEnabled ? <StatusPill tone="neutral">Disabled</StatusPill> : null}
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase text-zinc-700">{source.id}</p>
                    </div>
                    <span className="font-mono text-xs text-zinc-500">{source.latencyMs > 0 ? `${source.latencyMs}ms` : "—"}</span>
                  </div>
                  <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/45 px-3 py-2">
                    <p className="truncate font-mono text-[11px] text-zinc-400">{source.activeDomain || source.upstreamDomain || "—"}</p>
                    <p className="mt-1 text-[10px] text-zinc-700">Last check {formatChecked(source.lastCheckedAt)} · {source.mirrors?.length ?? 0} mirror</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <OpsButton type="button" size="sm" variant="secondary" onClick={() => openCoreEditor(source)}><PencilSimple className="h-3.5 w-3.5" />Edit</OpsButton>
                    <OpsButton type="button" size="sm" variant="secondary" onClick={() => void handleProbe(source.id)} disabled={probingId === source.id}>{probingId === source.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Lightning className="h-3.5 w-3.5" />}Probe</OpsButton>
                    <OpsButton type="button" size="sm" variant="danger" onClick={() => setPendingConfirm({ type: "flush-one", id: source.id, name: source.name })}><Trash className="h-3.5 w-3.5" />Flush</OpsButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </OpsCard>

      <OpsCard className="overflow-hidden">
        <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
          <OpsSectionHeader
            eyebrow="Dynamic adapters"
            title="Custom sources"
            description="Source yang disimpan dinamis dan dapat diperbaiki tanpa redeploy aplikasi."
            action={<OpsButton type="button" size="sm" variant="secondary" onClick={() => openCustomEditor(null)}><Plus className="h-3.5 w-3.5" />Tambah custom</OpsButton>}
          />
        </div>

        {loadingCustom && customSources.length === 0 ? (
          <div className="flex min-h-36 items-center justify-center text-xs text-zinc-600"><CircleNotch className="mr-2 h-4 w-4 animate-spin" />Memuat custom source…</div>
        ) : customSources.length === 0 ? (
          <EmptyState icon={<SlidersHorizontal className="h-5 w-5" />} title="Belum ada custom source" description="Gunakan source studio untuk menambahkan adapter HTML/API tanpa deploy ulang." action={<OpsButton type="button" variant="primary" onClick={() => openCustomEditor(null)}><Plus className="h-4 w-4" />Buka source studio</OpsButton>} />
        ) : (
          <div className="grid gap-px bg-zinc-800/70 md:grid-cols-2 xl:grid-cols-3">
            {customSources.map((source) => (
              <article key={source.id} className="flex min-h-48 flex-col bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium text-zinc-200">{source.name}</h3>
                      {source.isNsfw ? <StatusPill tone="danger">18+</StatusPill> : null}
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-zinc-700">{source.id} · {source.type} · {source.lang}</p>
                  </div>
                  <StatusPill tone={source.isEnabled ? "success" : "neutral"} dot>{source.isEnabled ? "Enabled" : "Disabled"}</StatusPill>
                </div>

                <div className="mt-4 flex-1">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/45 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
                      <span className="truncate font-mono text-[11px] text-zinc-400">{source.baseUrl}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusPill tone="neutral">{source.mirrors.length} mirror</StatusPill>
                    <StatusPill tone="neutral">{source.type.toUpperCase()}</StatusPill>
                    <StatusPill tone="neutral">{source.lang.toUpperCase()}</StatusPill>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-zinc-800/70 pt-3">
                  <OpsButton type="button" size="sm" variant="secondary" className="flex-1" onClick={() => openCustomEditor(source)}><PencilSimple className="h-3.5 w-3.5" />Edit</OpsButton>
                  <a href={source.baseUrl} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600 transition hover:text-zinc-200" title="Buka upstream"><ArrowSquareOut className="h-3.5 w-3.5" /></a>
                  <OpsButton type="button" size="sm" variant="danger" className="px-2" onClick={() => setPendingConfirm({ type: "delete-custom", id: source.id, name: source.name })} disabled={deletingId === source.id}>{deletingId === source.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}</OpsButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </OpsCard>

      <CoreSourceModal
        isOpen={coreModalOpen}
        source={editingCoreSource}
        onClose={() => { setCoreModalOpen(false); setEditingCoreSource(null); }}
        onSaved={onRefresh}
        getToken={getToken}
      />

      <CustomSourceModal
        isOpen={modalOpen}
        initialSource={editingSource}
        onClose={() => { setModalOpen(false); setEditingSource(null); }}
        onSaved={async () => { await fetchCustomSources(); await onRefresh(); }}
        getToken={getToken}
      />

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={
          pendingConfirm?.type === "delete-custom"
            ? `Hapus ${pendingConfirm.name}?`
            : pendingConfirm?.type === "flush-one"
              ? `Flush cache ${pendingConfirm.name}?`
              : "Flush seluruh source cache?"
        }
        description={
          pendingConfirm?.type === "delete-custom"
            ? "Custom source akan dihapus permanen dari konfigurasi dinamis. Tindakan ini tidak dapat dibatalkan dari portal."
            : pendingConfirm?.type === "flush-one"
              ? "Cache source ini akan dibersihkan sehingga request berikutnya dapat memicu fetch ulang ke upstream."
              : "Seluruh cache source akan dibersihkan. Request berikutnya dapat meningkatkan beban upstream sementara."
        }
        confirmLabel={pendingConfirm?.type === "delete-custom" ? "Hapus source" : "Flush cache"}
        danger
        busy={confirmBusy}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (pendingConfirm?.type === "delete-custom") void handleDeleteCustom(pendingConfirm.id, pendingConfirm.name);
          else if (pendingConfirm?.type === "flush-one") void handleFlush(pendingConfirm.id);
          else if (pendingConfirm?.type === "flush-all") void handleFlush();
        }}
      />
    </div>
  );
}
