"use client";

import React, { useState } from "react";
import { 
  X, 
  CircleNotch, 
  CheckCircle, 
  WarningCircle, 
  Lightning, 
  FloppyDisk, 
  Code,
  SlidersHorizontal
} from "@phosphor-icons/react";
import type { CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import type { ParserTestResult } from "@/server/lib/sources/custom-source-service";

interface CustomSourceModalProps {
  initialSource?: CustomSourceDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function CustomSourceModal({
  initialSource,
  isOpen,
  onClose,
  onSaved,
  getToken,
}: CustomSourceModalProps) {
  const isEditing = Boolean(initialSource);

  const [formData, setFormData] = useState<CustomSourceDefinition>(
    initialSource || {
      id: "",
      name: "",
      baseUrl: "",
      mirrors: [],
      lang: "id",
      version: "1.0.0",
      type: "html",
      isNsfw: false,
      isEnabled: true,
      selectors: {
        popularPath: "/daftar-komik?order=popular",
        popularListSelector: ".list-update_item",
        titleSelector: "h3.title",
        coverSelector: "img",
        linkSelector: "a",
        chapterListSelector: ".chapter-list li",
        chapterTitleSelector: ".chapter-title",
        pagesSelector: "#readerarea img",
      },
    }
  );

  const [mirrorsText, setMirrorsText] = useState(
    (initialSource?.mirrors || []).join("\n")
  );

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ParserTestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestParser = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const token = await getToken();
      const mirrors = mirrorsText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        ...formData,
        mirrors,
      };

      const res = await fetch("/api/admin/sources/custom/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setTestResult(data.result);
      } else {
        setError(data.error || "Gagal menguji parser");
      }
    } catch {
      setError("Gagal menghubungi server untuk live test");
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      const mirrors = mirrorsText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        ...formData,
        id: formData.id.toLowerCase().trim(),
        mirrors,
      };

      const res = await fetch("/api/admin/sources/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        await onSaved();
        onClose();
      } else {
        setError(data.error || "Gagal menyimpan konfigurasi sumber");
      }
    } catch {
      setError("Gagal menghubungi server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                {isEditing ? `Edit & Perbaiki Sumber: ${formData.name}` : "Studio Sumber Manga Kustom"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Konfigurasi scraping dinamis (CSS Selectors / REST API) langsung dari browser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2">
              <WarningCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Source ID (Kunci Unik)</label>
              <input
                type="text"
                disabled={isEditing}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="contoh: komikcast"
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono disabled:opacity-50 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Nama Tampilan</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="contoh: Komikcast ID"
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          {/* URLs */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Base URL Utama</label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://komikcast.bz"
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Domain Mirrors (Cadangan jika domain utama diblokir, 1 baris per URL)
            </label>
            <textarea
              rows={2}
              value={mirrorsText}
              onChange={(e) => setMirrorsText(e.target.value)}
              placeholder="https://komikcast.me&#10;https://komikcast.site"
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Type & Lang */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Tipe Parser</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "html" | "api" })}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
              >
                <option value="html">HTML (CSS Selector)</option>
                <option value="api">REST API (JSON)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Bahasa</label>
              <input
                type="text"
                value={formData.lang}
                onChange={(e) => setFormData({ ...formData, lang: e.target.value })}
                placeholder="id"
                maxLength={2}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 uppercase focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Status</label>
              <select
                value={formData.isEnabled ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.value === "true" })}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
              >
                <option value="true">Aktif (Enabled)</option>
                <option value="false">Nonaktif (Disabled)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Konten 18+ (NSFW)</label>
              <select
                value={formData.isNsfw ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, isNsfw: e.target.value === "true" })}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
              >
                <option value="false">Tidak (Aman)</option>
                <option value="true">Ya (NSFW)</option>
              </select>
            </div>
          </div>

          {/* HTML Selectors Section */}
          {formData.type === "html" && (
            <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-3">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Code className="w-4 h-4 text-purple-400" /> CSS Selectors (Cheerio Engine)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Popular Path</label>
                  <input
                    type="text"
                    value={formData.selectors?.popularPath || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectors: {
                          ...formData.selectors!,
                          popularPath: e.target.value,
                        },
                      })
                    }
                    placeholder="/daftar-komik?order=popular"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Manga Item Container</label>
                  <input
                    type="text"
                    value={formData.selectors?.popularListSelector || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectors: {
                          ...formData.selectors!,
                          popularListSelector: e.target.value,
                        },
                      })
                    }
                    placeholder=".list-update_item"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Title Selector</label>
                  <input
                    type="text"
                    value={formData.selectors?.titleSelector || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectors: {
                          ...formData.selectors!,
                          titleSelector: e.target.value,
                        },
                      })
                    }
                    placeholder="h3.title"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Cover Image Selector</label>
                  <input
                    type="text"
                    value={formData.selectors?.coverSelector || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectors: {
                          ...formData.selectors!,
                          coverSelector: e.target.value,
                        },
                      })
                    }
                    placeholder="img"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Chapter List Selector</label>
                  <input
                    type="text"
                    value={formData.selectors?.chapterListSelector || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectors: {
                          ...formData.selectors!,
                          chapterListSelector: e.target.value,
                        },
                      })
                    }
                    placeholder=".chapter-list li"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Pages Image Selector</label>
                  <input
                    type="text"
                    value={formData.selectors?.pagesSelector || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectors: {
                          ...formData.selectors!,
                          pagesSelector: e.target.value,
                        },
                      })
                    }
                    placeholder="#readerarea img"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Test Sandbox Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs ${testResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              <div className="flex items-center gap-2 mb-2 font-semibold">
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <WarningCircle className="w-4 h-4" />}
                <span>
                  {testResult.success ? `Live Test Berhasil (${testResult.latencyMs}ms, ${testResult.extractedCount} item)` : "Live Test Gagal"}
                </span>
              </div>

              {testResult.errorMessage && (
                <p className="text-red-300 mb-2">{testResult.errorMessage}</p>
              )}

              {testResult.items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20">
                  {testResult.items.slice(0, 4).map((it, idx) => (
                    <div key={idx} className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                      {it.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.coverUrl} alt={it.title} className="w-full h-16 object-cover rounded mb-1" />
                      )}
                      <span className="font-medium text-zinc-200 truncate block text-[10px]">{it.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleTestParser}
              disabled={testing || !formData.baseUrl}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-medium rounded-xl transition"
            >
              {testing ? <CircleNotch className="w-4 h-4 animate-spin text-purple-400" /> : <Lightning className="w-4 h-4 text-purple-400" />}
              Uji Selector (Live Test)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || !formData.id || !formData.name || !formData.baseUrl}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition"
              >
                {saving ? <CircleNotch className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
                {isEditing ? "Simpan Perbaikan" : "Tambah Sumber"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
