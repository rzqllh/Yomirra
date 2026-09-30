"use client";

import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  Wrench, 
  ToggleLeft, 
  ToggleRight, 
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Eye,
  FloppyDisk,
  SlidersHorizontal
} from "@phosphor-icons/react";
import type { SiteConfig, AnnouncementType } from "@/shared/types/site-config";

interface SiteTabProps {
  initialConfig: SiteConfig | null;
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function SiteTab({ initialConfig, onRefresh, getToken }: SiteTabProps) {
  const [config, setConfig] = useState<SiteConfig | null>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  if (!config) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs">
        Memuat konfigurasi situs...
      </div>
    );
  }

  const handleSave = async (partial: Partial<SiteConfig>) => {
    setSaving(true);
    setMessage(null);
    // Generate a fresh announcement ID on every save so the public site
    // treats it as a new announcement (clears any previous sessionStorage dismiss)
    const payload =
      partial.announcement
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
        setMessage({ text: "Konfigurasi situs berhasil disimpan", ok: true });
        await onRefresh();
      } else {
        setMessage({ text: data.error || "Gagal menyimpan konfigurasi situs", ok: false });
      }
    } catch {
      setMessage({ text: "Gagal menghubungkan ke server", ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-purple-400" />
          Kontrol Situs & Pengumuman Publik
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Atur pengumuman banner global di header website publik, mode pemeliharaan, dan feature flags.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
            message.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {message.ok ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <WarningCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Banner Editor Card */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-purple-400" />
            Banner Pengumuman Situs
          </h3>
          <button
            type="button"
            onClick={() =>
              setConfig({
                ...config,
                announcement: {
                  ...config.announcement,
                  enabled: !config.announcement.enabled,
                  id: `ann-${Date.now()}`,
                },
              })
            }
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300"
          >
            {config.announcement.enabled ? (
              <>
                <span className="text-emerald-400">Aktif</span>
                <ToggleRight className="w-6 h-6 text-emerald-400" />
              </>
            ) : (
              <>
                <span className="text-zinc-500">Nonaktif</span>
                <ToggleLeft className="w-6 h-6 text-zinc-500" />
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Teks Pengumuman
            </label>
            <textarea
              rows={2}
              value={config.announcement.message}
              onChange={(e) =>
                setConfig({
                  ...config,
                  announcement: {
                    ...config.announcement,
                    message: e.target.value,
                  },
                })
              }
              placeholder="Contoh: Kami sedang memigrasi server untuk performa baca lebih cepat..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Tipe Tampilan
              </label>
              <select
                value={config.announcement.type}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: {
                      ...config.announcement,
                      type: e.target.value as AnnouncementType,
                    },
                  })
                }
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              >
                <option value="info">Info (Netral / Biru)</option>
                <option value="warning">Warning (Peringatan / Kuning)</option>
                <option value="alert">Alert (Kritis / Merah)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Link URL Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={config.announcement.link || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: {
                      ...config.announcement,
                      link: e.target.value || undefined,
                    },
                  })
                }
                placeholder="https://t.me/yomirra atau /updates"
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mb-2 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" /> Pratinjau Tampilan Banner Publik
          </span>
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              config.announcement.type === "alert"
                ? "bg-red-950/40 border-red-800/60 text-red-200"
                : config.announcement.type === "warning"
                ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
                : "bg-blue-950/40 border-blue-800/60 text-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span>{config.announcement.message || "Teks pengumuman kosong..."}</span>
            </div>
            {config.announcement.link && (
              <span className="underline font-medium text-[11px] shrink-0">
                Selengkapnya →
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => handleSave({ announcement: config.announcement })}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
        >
          {saving ? <CircleNotch className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
          Simpan Banner Pengumuman
        </button>
      </div>

      {/* 2. Maintenance Mode Card */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            Mode Pemeliharaan (Maintenance Mode)
          </h3>
          <button
            type="button"
            onClick={() =>
              setConfig({
                ...config,
                maintenanceMode: {
                  ...config.maintenanceMode,
                  enabled: !config.maintenanceMode.enabled,
                },
              })
            }
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300"
          >
            {config.maintenanceMode.enabled ? (
              <>
                <span className="text-red-400 font-semibold">Aktif</span>
                <ToggleRight className="w-6 h-6 text-red-400" />
              </>
            ) : (
              <>
                <span className="text-zinc-500">Nonaktif</span>
                <ToggleLeft className="w-6 h-6 text-zinc-500" />
              </>
            )}
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Pesan Pemeliharaan
          </label>
          <input
            type="text"
            value={config.maintenanceMode.message || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                maintenanceMode: {
                  ...config.maintenanceMode,
                  message: e.target.value,
                },
              })
            }
            placeholder="Yomirra sedang dalam pemeliharaan rutin. Kami akan segera kembali!"
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => handleSave({ maintenanceMode: config.maintenanceMode })}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
        >
          {saving ? <CircleNotch className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
          Simpan Mode Pemeliharaan
        </button>
      </div>

      {/* 3. Feature Flags Card — Coming Soon */}
      <div className="p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl space-y-4 opacity-70">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
            Feature Flags
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-500 border border-zinc-700">
              Segera
            </span>
          </h3>
          <span
            title="Toggle ini tersimpan di konfigurasi, tapi belum terhubung ke runtime. Fitur ini sedang dalam pengembangan."
            className="text-[10px] text-zinc-600 cursor-help border-b border-dashed border-zinc-700"
          >
            belum aktif
          </span>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Toggle di bawah ini belum terhubung ke runtime. Pengaturannya tersimpan, tapi belum ada efek pada sistem yang berjalan. Akan diaktifkan bertahap.
        </p>

        <div className="space-y-2">
          {[
            { label: "Semantic Search (Gemini)", desc: "Pencarian berbasis pemahaman makna dan sinonim" },
            { label: "Auto Source Fallback", desc: "Ganti source otomatis jika source utama tidak merespons" },
            { label: "Telegram Ops Alerts", desc: "Kirim notifikasi gangguan ke Telegram" },
            { label: "Data Saver Default", desc: "Kompresi gambar default untuk koneksi lambat" },
          ].map((flag) => (
            <div key={flag.label} className="flex items-center justify-between p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <div>
                <span className="text-xs font-medium text-zinc-400">{flag.label}</span>
                <p className="text-[10px] text-zinc-600">{flag.desc}</p>
              </div>
              <div className="w-10 h-5 rounded-full bg-zinc-800 border border-zinc-700 opacity-40 cursor-not-allowed" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
