"use client";

import React, { useEffect, useState } from "react";
import {
  CircleNotch,
  Eye,
  FloppyDisk,
  Megaphone,
  SlidersHorizontal,
  Wrench,
} from "@phosphor-icons/react";
import type { SiteConfig, AnnouncementType } from "@/shared/types/site-config";
import {
  ConfirmDialog,
  EmptyState,
  FeedbackBanner,
  InlineNotice,
  OpsButton,
  OpsCard,
  OpsSectionHeader,
  OpsSelect,
  StatusPill,
  cx,
} from "../components/admin-ui";

interface SiteTabProps {
  initialConfig: SiteConfig | null;
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

function Switch({
  checked,
  onChange,
  label,
  danger = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span className={cx("text-[11px] font-medium", checked ? (danger ? "text-rose-300" : "text-emerald-300") : "text-zinc-600")}>
        {checked ? "Aktif" : "Nonaktif"}
      </span>
      <span className={cx("relative h-5 w-9 rounded-full border transition", checked ? (danger ? "border-rose-500/50 bg-rose-500/25" : "border-emerald-500/50 bg-emerald-500/25") : "border-zinc-700 bg-zinc-900")}>
        <span className={cx("absolute top-0.5 h-3.5 w-3.5 rounded-full bg-zinc-200 transition-transform", checked ? "translate-x-[17px]" : "translate-x-0.5")} />
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function SiteTab({ initialConfig, onRefresh, getToken }: SiteTabProps) {
  const [config, setConfig] = useState<SiteConfig | null>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  if (!config) {
    return (
      <OpsCard>
        <EmptyState title="Konfigurasi situs belum tersedia" description="Portal belum menerima konfigurasi Site Control dari admin API." />
      </OpsCard>
    );
  }

  const handleSave = async (partial: Partial<SiteConfig>) => {
    setSaving(true);
    setMessage(null);
    const payload = partial.announcement
      ? { ...partial, announcement: { ...partial.announcement, id: `ann-${Date.now()}` } }
      : partial;

    try {
      const token = await getToken();
      const res = await fetch("/api/admin/site/config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setConfig(data.config);
        setMessage({ text: "Site Control berhasil diperbarui.", ok: true });
        await onRefresh();
      } else {
        setMessage({ text: data.error || "Konfigurasi situs gagal disimpan.", ok: false });
      }
    } catch {
      setMessage({ text: "Server tidak dapat dihubungi saat menyimpan konfigurasi.", ok: false });
    } finally {
      setSaving(false);
      setConfirmMaintenance(false);
    }
  };

  const requestMaintenanceSave = () => {
    const enablingMaintenance = config.maintenanceMode.enabled && !initialConfig?.maintenanceMode.enabled;
    if (enablingMaintenance) setConfirmMaintenance(true);
    else void handleSave({ maintenanceMode: config.maintenanceMode });
  };

  const bannerTypeTone = config.announcement.type === "alert" ? "danger" : config.announcement.type === "warning" ? "warning" : "neutral";

  return (
    <div className="space-y-6">
      <OpsSectionHeader
        eyebrow="Public operations"
        title="Site Control"
        description="Kendalikan announcement publik dan maintenance mode. Perubahan di sini dapat langsung memengaruhi reader production."
      />

      {message ? <FeedbackBanner message={message.text} ok={message.ok} onDismiss={() => setMessage(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <OpsCard className="overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 px-4 py-4 sm:px-5">
              <div>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-red-400" />
                  <h3 className="text-sm font-medium text-zinc-200">Announcement banner</h3>
                  <StatusPill tone={config.announcement.enabled ? "success" : "neutral"} dot>{config.announcement.enabled ? "Published" : "Draft"}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-zinc-600">Banner global yang muncul di reader publik.</p>
              </div>
              <Switch
                label="Announcement banner"
                checked={config.announcement.enabled}
                onChange={(enabled) => setConfig({ ...config, announcement: { ...config.announcement, enabled, id: `ann-${Date.now()}` } })}
              />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <label htmlFor="announcement-message" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Teks pengumuman</label>
                <textarea
                  id="announcement-message"
                  rows={3}
                  value={config.announcement.message}
                  onChange={(event) => setConfig({ ...config, announcement: { ...config.announcement, message: event.target.value } })}
                  placeholder="Contoh: Source tertentu sedang mengalami gangguan…"
                  className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="announcement-type" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Severity</label>
                  <OpsSelect
                    id="announcement-type"
                    value={config.announcement.type}
                    onChange={(event) => setConfig({ ...config, announcement: { ...config.announcement, type: event.target.value as AnnouncementType } })}
                  >
                    <option value="info" className="bg-zinc-900 text-zinc-200">Info</option>
                    <option value="warning" className="bg-zinc-900 text-zinc-200">Warning</option>
                    <option value="alert" className="bg-zinc-900 text-zinc-200">Critical</option>
                  </OpsSelect>
                </div>
                <div>
                  <label htmlFor="announcement-link" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Link tambahan</label>
                  <input
                    id="announcement-link"
                    type="text"
                    value={config.announcement.link || ""}
                    onChange={(event) => setConfig({ ...config, announcement: { ...config.announcement, link: event.target.value || undefined } })}
                    placeholder="/updates atau https://…"
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700"><Eye className="h-3.5 w-3.5" />Preview</div>
                <div className={cx("flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs", bannerTypeTone === "danger" ? "border-rose-500/25 bg-rose-500/10 text-rose-200" : bannerTypeTone === "warning" ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-zinc-700 bg-zinc-900 text-zinc-300")}>
                  <div className="flex min-w-0 items-center gap-2"><Megaphone className="h-4 w-4 shrink-0" /><span className="min-w-0">{config.announcement.message || "Teks pengumuman kosong…"}</span></div>
                  {config.announcement.link ? <span className="shrink-0 text-[10px] font-medium underline underline-offset-2">Selengkapnya</span> : null}
                </div>
              </div>

              <div className="flex justify-end">
                <OpsButton type="button" variant="primary" onClick={() => void handleSave({ announcement: config.announcement })} disabled={saving}>
                  {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
                  Simpan announcement
                </OpsButton>
              </div>
            </div>
          </OpsCard>

          <OpsCard className="overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 px-4 py-4 sm:px-5">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-zinc-200">Maintenance mode</h3>
                  <StatusPill tone={config.maintenanceMode.enabled ? "danger" : "success"} dot>{config.maintenanceMode.enabled ? "Active" : "Normal"}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-zinc-600">Gunakan hanya ketika reader publik memang perlu dibatasi.</p>
              </div>
              <Switch
                danger
                label="Maintenance mode"
                checked={config.maintenanceMode.enabled}
                onChange={(enabled) => setConfig({ ...config, maintenanceMode: { ...config.maintenanceMode, enabled } })}
              />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {config.maintenanceMode.enabled ? (
                <InlineNotice tone="danger">Maintenance mode akan membatasi reader production. Pastikan pesan pengguna menjelaskan kondisi dengan jelas.</InlineNotice>
              ) : null}

              <div>
                <label htmlFor="maintenance-message" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Pesan maintenance</label>
                <input
                  id="maintenance-message"
                  type="text"
                  value={config.maintenanceMode.message || ""}
                  onChange={(event) => setConfig({ ...config, maintenanceMode: { ...config.maintenanceMode, message: event.target.value } })}
                  placeholder="Yomirra sedang dalam pemeliharaan rutin…"
                  className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              <div className="flex justify-end">
                <OpsButton type="button" variant={config.maintenanceMode.enabled ? "danger" : "secondary"} onClick={requestMaintenanceSave} disabled={saving}>
                  {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
                  Simpan maintenance state
                </OpsButton>
              </div>
            </div>
          </OpsCard>
        </div>

        <div className="space-y-6">
          <OpsCard className="p-4 sm:p-5">
            <OpsSectionHeader eyebrow="Current state" title="Public surface" />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 pb-3"><span className="text-xs text-zinc-500">Reader access</span><StatusPill tone={config.maintenanceMode.enabled ? "danger" : "success"} dot>{config.maintenanceMode.enabled ? "Restricted" : "Normal"}</StatusPill></div>
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 pb-3"><span className="text-xs text-zinc-500">Announcement</span><StatusPill tone={config.announcement.enabled ? "brand" : "neutral"}>{config.announcement.enabled ? "Visible" : "Hidden"}</StatusPill></div>
              <div className="flex items-center justify-between gap-3"><span className="text-xs text-zinc-500">Announcement type</span><StatusPill tone={bannerTypeTone}>{config.announcement.type}</StatusPill></div>
            </div>
          </OpsCard>

          <OpsCard className="overflow-hidden opacity-75">
            <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-zinc-600" /><h3 className="text-sm font-medium text-zinc-400">Feature availability</h3></div>
                <StatusPill tone="neutral">Future</StatusPill>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-zinc-700">Kontrol berikut belum terhubung ke runtime dan tidak dapat diubah dari portal.</p>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {[
                ["Semantic Search", "Gemini/semantic understanding"],
                ["Auto Source Fallback", "Fallback source ketika upstream gagal"],
                ["Telegram Ops Alerts", "Alert gangguan otomatis"],
                ["Data Saver Default", "Default kompresi untuk reader"],
              ].map(([label, description]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div><p className="text-xs text-zinc-500">{label}</p><p className="mt-0.5 text-[10px] text-zinc-700">{description}</p></div>
                  <span className="h-5 w-9 rounded-full border border-zinc-800 bg-zinc-900" />
                </div>
              ))}
            </div>
          </OpsCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmMaintenance}
        title="Aktifkan maintenance mode?"
        description="Reader publik akan dibatasi sesuai implementasi maintenance yang berjalan. Pastikan announcement dan pesan maintenance sudah sesuai."
        confirmLabel="Aktifkan maintenance"
        danger
        busy={saving}
        onClose={() => setConfirmMaintenance(false)}
        onConfirm={() => void handleSave({ maintenanceMode: config.maintenanceMode })}
      />
    </div>
  );
}
