"use client";

import React, { useState } from "react";
import { 
  X, 
  CircleNotch, 
  CheckCircle, 
  WarningCircle, 
  FloppyDisk, 
  SlidersHorizontal,
  Globe
} from "@phosphor-icons/react";
import type { SourceHealthMatrixItem } from "@/server/lib/sources/admin-source-service";

interface CoreSourceModalProps {
  source: SourceHealthMatrixItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function CoreSourceModal({
  source,
  isOpen,
  onClose,
  onSaved,
  getToken,
}: CoreSourceModalProps) {
  const [activeDomain, setActiveDomain] = useState(source?.activeDomain || "");
  const [mirrorsText, setMirrorsText] = useState((source?.mirrors || []).join(", "));
  const [isEnabled, setIsEnabled] = useState(source?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Sync state when source changes
  React.useEffect(() => {
    if (source) {
      setActiveDomain(source.activeDomain || "");
      setMirrorsText((source.mirrors || []).join(", "));
      setIsEnabled(source.isEnabled ?? true);
      setMessage(null);
    }
  }, [source]);

  if (!isOpen || !source) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = await getToken();
      const mirrors = mirrorsText
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

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
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui konfigurasi sumber core");
      }

      setMessage({ text: data.message || "Konfigurasi dinamis berhasil disimpan!", ok: true });
      await onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Override Dinamis: {source.name}
              </h2>
              <p className="text-xs text-zinc-400">
                Ubah domain aktif & status sumber bawaan tanpa redeploy kode.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                message.ok
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {message.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <WarningCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Domain / Base URL Aktif
            </label>
            <input
              type="url"
              required
              value={activeDomain}
              onChange={(e) => setActiveDomain(e.target.value)}
              placeholder="https://shinigami03.com"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Ketika website upstream mengganti domain (misal .asia ke .id atau .com), ganti di sini untuk langsung mengaktifkannya secara global.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Daftar Domain Mirror (Dipisahkan koma)
            </label>
            <textarea
              rows={2}
              value={mirrorsText}
              onChange={(e) => setMirrorsText(e.target.value)}
              placeholder="https://mirror1.com, https://mirror2.com"
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Status Sumber</span>
              <span className="text-[11px] text-zinc-500 block">
                Nonaktifkan sementara jika website sedang down atau maintenance.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 shadow-lg shadow-purple-600/20"
            >
              {saving ? (
                <>
                  <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FloppyDisk className="w-3.5 h-3.5" />
                  Simpan Override ke Redis
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
