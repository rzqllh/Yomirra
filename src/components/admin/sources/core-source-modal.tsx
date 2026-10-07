"use client";

import React, { useEffect, useState } from "react";
import {
  CircleNotch,
  FloppyDisk,
  Globe,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import type { SourceHealthMatrixItem } from "@/shared/types/admin";
import {
  FeedbackBanner,
  InlineNotice,
  OpsButton,
  StatusPill,
  cx,
} from "../components/admin-ui";

interface CoreSourceModalProps {
  source: SourceHealthMatrixItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function CoreSourceModal({ source, isOpen, onClose, onSaved, getToken }: CoreSourceModalProps) {
  const [activeDomain, setActiveDomain] = useState("");
  const [mirrorsText, setMirrorsText] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!source) return;
    setActiveDomain(source.activeDomain || "");
    setMirrorsText((source.mirrors || []).join(", "));
    setIsEnabled(source.isEnabled ?? true);
    setMessage(null);
  }, [source, isOpen]);

  if (!isOpen || !source) return null;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = await getToken();
      const mirrors = mirrorsText.split(",").map((value) => value.trim()).filter(Boolean);
      const res = await fetch("/api/admin/sources", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}`, "x-admin-key": token } : {}),
        },
        body: JSON.stringify({
          sourceId: source.id,
          activeDomain: activeDomain.trim(),
          mirrors,
          isEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Konfigurasi source gagal diperbarui.");

      setMessage({ text: data.message || "Override source berhasil disimpan.", ok: true });
      await onSaved();
      onClose();
    } catch (error: unknown) {
      setMessage({ text: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan source.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="core-source-title"
        style={{ colorScheme: "dark" }}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/90 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300"><SlidersHorizontal className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-400/90">Core source override</p>
              <h2 id="core-source-title" className="mt-1 truncate text-base font-semibold text-zinc-100">{source.name}</h2>
              <p className="mt-1 text-[11px] leading-4 text-zinc-600">Ubah domain, mirrors, dan availability tanpa redeploy aplikasi.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200" aria-label="Tutup modal"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {message ? <FeedbackBanner message={message.text} ok={message.ok} /> : null}

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/45 px-3 py-2.5">
              <StatusPill tone="neutral" className="font-mono uppercase">{source.id}</StatusPill>
              <StatusPill tone={source.status === "HEALTHY" ? "success" : source.status === "DEGRADED" ? "warning" : source.status === "DOWN" ? "danger" : "neutral"} dot>{source.status}</StatusPill>
              <span className="ml-auto font-mono text-[10px] text-zinc-700">{source.latencyMs > 0 ? `${source.latencyMs} ms` : "no latency sample"}</span>
            </div>

            <div>
              <label htmlFor="core-domain" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400"><Globe className="h-3.5 w-3.5 text-zinc-600" />Active domain / base URL</label>
              <input id="core-domain" type="url" required value={activeDomain} onChange={(event) => setActiveDomain(event.target.value)} placeholder="https://source.example" className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10" />
              <p className="mt-1.5 text-[10px] leading-4 text-zinc-700">Gunakan ketika upstream mengganti domain atau primary host.</p>
            </div>

            <div>
              <label htmlFor="core-mirrors" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Mirror domains</label>
              <textarea id="core-mirrors" rows={3} value={mirrorsText} onChange={(event) => setMirrorsText(event.target.value)} placeholder="https://mirror1.example, https://mirror2.example" className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 font-mono text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10" />
              <p className="mt-1.5 text-[10px] text-zinc-700">Pisahkan tiap mirror dengan koma.</p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/35 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Source availability</p>
                  <p className="mt-1 text-[10px] leading-4 text-zinc-700">Nonaktifkan sementara jika upstream sedang down atau tidak layak digunakan.</p>
                </div>
                <button type="button" role="switch" aria-checked={isEnabled} onClick={() => setIsEnabled((value) => !value)} className="flex shrink-0 items-center gap-2">
                  <span className={cx("text-[10px] font-medium", isEnabled ? "text-emerald-300" : "text-zinc-600")}>{isEnabled ? "Enabled" : "Disabled"}</span>
                  <span className={cx("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors", isEnabled ? "border-emerald-500/45 bg-emerald-500/20" : "border-zinc-700 bg-zinc-900")}>
                    <span className={cx("absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-zinc-200 shadow-sm transition-transform", isEnabled ? "translate-x-4" : "translate-x-0")} />
                  </span>
                </button>
              </div>
            </div>

            {!isEnabled ? <InlineNotice tone="warning">Source yang dinonaktifkan dapat hilang dari flow reader yang menghormati source activation state.</InlineNotice> : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800/90 bg-zinc-950 px-5 py-4">
            <OpsButton type="button" variant="ghost" onClick={onClose} disabled={saving}>Batal</OpsButton>
            <OpsButton type="submit" variant="primary" disabled={saving || !activeDomain.trim()}>{saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}{saving ? "Menyimpan…" : "Simpan override"}</OpsButton>
          </div>
        </form>
      </div>
    </div>
  );
}
