"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  CircleNotch,
  Code,
  FloppyDisk,
  Globe,
  Lightning,
  SlidersHorizontal,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import type { ParserTestResult } from "@/server/lib/sources/custom-source-service";
import {
  FeedbackBanner,
  InlineNotice,
  OpsButton,
  OpsSelect,
  StatusPill,
  cx,
} from "../components/admin-ui";

interface CustomSourceModalProps {
  initialSource?: CustomSourceDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const EMPTY_SOURCE: CustomSourceDefinition = {
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
};

export function CustomSourceModal({ initialSource, isOpen, onClose, onSaved, getToken }: CustomSourceModalProps) {
  const isEditing = Boolean(initialSource);
  const [formData, setFormData] = useState<CustomSourceDefinition>(initialSource || EMPTY_SOURCE);
  const [mirrorsText, setMirrorsText] = useState((initialSource?.mirrors || []).join("\n"));
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ParserTestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const nextSource = initialSource || EMPTY_SOURCE;
    setFormData({
      ...nextSource,
      mirrors: [...(nextSource.mirrors || [])],
      selectors: nextSource.selectors ? { ...nextSource.selectors } : EMPTY_SOURCE.selectors,
    });
    setMirrorsText((nextSource.mirrors || []).join("\n"));
    setTestResult(null);
    setError(null);
  }, [initialSource, isOpen]);

  if (!isOpen) return null;

  const handleTestParser = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const token = await getToken();
      const mirrors = mirrorsText.split("\n").map((value) => value.trim()).filter(Boolean);
      const res = await fetch("/api/admin/sources/custom/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...formData, mirrors }),
      });
      const data = await res.json();
      if (res.ok && data.result) setTestResult(data.result);
      else setError(data.error || "Parser test gagal dijalankan.");
    } catch {
      setError("Server tidak dapat dihubungi untuk live parser test.");
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const mirrors = mirrorsText.split("\n").map((value) => value.trim()).filter(Boolean);
      const payload = { ...formData, id: formData.id.toLowerCase().trim(), mirrors };
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
        setError(data.error || "Custom source gagal disimpan.");
      }
    } catch {
      setError("Server tidak dapat dihubungi saat menyimpan custom source.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-source-title"
        style={{ colorScheme: "dark" }}
        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/90 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300"><SlidersHorizontal className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-400/90">Dynamic source studio</p>
              <h2 id="custom-source-title" className="mt-1 truncate text-base font-semibold text-zinc-100">{isEditing ? `Edit ${formData.name || formData.id}` : "Tambah custom source"}</h2>
              <p className="mt-1 text-[11px] leading-4 text-zinc-600">Konfigurasi adapter HTML/API dan validasi parser sebelum disimpan.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200" aria-label="Tutup modal"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {error ? <FeedbackBanner message={error} ok={false} /> : null}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium text-zinc-300">Identity & endpoint</p><p className="mt-0.5 text-[10px] text-zinc-700">Metadata utama untuk mengenali source dan upstream.</p></div><StatusPill tone={formData.isEnabled ? "success" : "neutral"} dot>{formData.isEnabled ? "Enabled" : "Disabled"}</StatusPill></div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="custom-source-id" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Source ID</label>
                  <input id="custom-source-id" type="text" disabled={isEditing} required value={formData.id} onChange={(event) => setFormData({ ...formData, id: event.target.value })} placeholder="komikcast" className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-50" />
                </div>
                <div>
                  <label htmlFor="custom-source-name" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Display name</label>
                  <input id="custom-source-name" type="text" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Komikcast ID" className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10" />
                </div>
              </div>

              <div>
                <label htmlFor="custom-base-url" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400"><Globe className="h-3.5 w-3.5 text-zinc-600" />Base URL</label>
                <input id="custom-base-url" type="url" required value={formData.baseUrl} onChange={(event) => setFormData({ ...formData, baseUrl: event.target.value })} placeholder="https://source.example" className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10" />
              </div>

              <div>
                <label htmlFor="custom-mirrors" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Mirror domains</label>
                <textarea id="custom-mirrors" rows={3} value={mirrorsText} onChange={(event) => setMirrorsText(event.target.value)} placeholder={"https://mirror-one.example\nhttps://mirror-two.example"} className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 font-mono text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10" />
                <p className="mt-1.5 text-[10px] text-zinc-700">Satu URL per baris.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label htmlFor="custom-type" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Parser</label>
                  <OpsSelect
                    id="custom-type"
                    value={formData.type}
                    onChange={(event) => setFormData({ ...formData, type: event.target.value as "html" | "api" })}
                  >
                    <option value="html" className="bg-zinc-900 text-zinc-200">HTML</option>
                    <option value="api" className="bg-zinc-900 text-zinc-200">REST API</option>
                  </OpsSelect>
                </div>
                <div>
                  <label htmlFor="custom-lang" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Language</label>
                  <input id="custom-lang" type="text" maxLength={2} value={formData.lang} onChange={(event) => setFormData({ ...formData, lang: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 text-xs uppercase text-zinc-200 outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label htmlFor="custom-enabled" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Status</label>
                  <OpsSelect
                    id="custom-enabled"
                    value={formData.isEnabled ? "true" : "false"}
                    onChange={(event) => setFormData({ ...formData, isEnabled: event.target.value === "true" })}
                  >
                    <option value="true" className="bg-zinc-900 text-zinc-200">Enabled</option>
                    <option value="false" className="bg-zinc-900 text-zinc-200">Disabled</option>
                  </OpsSelect>
                </div>
                <div>
                  <label htmlFor="custom-nsfw" className="mb-1.5 block text-[11px] font-medium text-zinc-400">Content</label>
                  <OpsSelect
                    id="custom-nsfw"
                    value={formData.isNsfw ? "true" : "false"}
                    onChange={(event) => setFormData({ ...formData, isNsfw: event.target.value === "true" })}
                  >
                    <option value="false" className="bg-zinc-900 text-zinc-200">General</option>
                    <option value="true" className="bg-zinc-900 text-zinc-200">18+ / NSFW</option>
                  </OpsSelect>
                </div>
              </div>
            </section>

            {formData.type === "html" ? (
              <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/30">
                <div className="border-b border-zinc-800/80 px-4 py-3">
                  <div className="flex items-center gap-2"><Code className="h-4 w-4 text-red-400" /><p className="text-xs font-medium text-zinc-300">HTML selector contract</p></div>
                  <p className="mt-1 text-[10px] text-zinc-700">Selector inti yang digunakan parser Cheerio untuk catalog dan reader.</p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <SelectorField label="Popular path" value={formData.selectors?.popularPath || ""} placeholder="/daftar-komik?order=popular" onChange={(value) => setFormData({ ...formData, selectors: { ...formData.selectors!, popularPath: value } })} />
                  <SelectorField label="List item" value={formData.selectors?.popularListSelector || ""} placeholder=".list-update_item" onChange={(value) => setFormData({ ...formData, selectors: { ...formData.selectors!, popularListSelector: value } })} />
                  <SelectorField label="Title" value={formData.selectors?.titleSelector || ""} placeholder="h3.title" onChange={(value) => setFormData({ ...formData, selectors: { ...formData.selectors!, titleSelector: value } })} />
                  <SelectorField label="Cover image" value={formData.selectors?.coverSelector || ""} placeholder="img" onChange={(value) => setFormData({ ...formData, selectors: { ...formData.selectors!, coverSelector: value } })} />
                  <SelectorField label="Chapter list" value={formData.selectors?.chapterListSelector || ""} placeholder=".chapter-list li" onChange={(value) => setFormData({ ...formData, selectors: { ...formData.selectors!, chapterListSelector: value } })} />
                  <SelectorField label="Reader pages" value={formData.selectors?.pagesSelector || ""} placeholder="#readerarea img" onChange={(value) => setFormData({ ...formData, selectors: { ...formData.selectors!, pagesSelector: value } })} />
                </div>
              </section>
            ) : (
              <InlineNotice tone="neutral">REST API mode memakai kontrak parser API yang sudah tersedia pada service. Selector HTML tidak digunakan.</InlineNotice>
            )}

            <section className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-medium text-zinc-300">Parser validation</p><p className="mt-0.5 text-[10px] text-zinc-700">Jalankan live test sebelum menyimpan perubahan selector atau domain.</p></div>
                <OpsButton type="button" variant="secondary" onClick={() => void handleTestParser()} disabled={testing || !formData.baseUrl}>{testing ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Lightning className="h-4 w-4 text-amber-400" />}Run live test</OpsButton>
              </div>

              {testResult ? (
                <div className={cx("rounded-2xl border p-4", testResult.success ? "border-emerald-500/25 bg-emerald-500/[0.06]" : "border-rose-500/25 bg-rose-500/[0.06]")}> 
                  <div className="flex items-start gap-2.5">
                    {testResult.success ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" weight="fill" /> : <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" weight="fill" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className={cx("text-xs font-medium", testResult.success ? "text-emerald-200" : "text-rose-200")}>{testResult.success ? "Parser test passed" : "Parser test failed"}</p>{testResult.success ? <StatusPill tone="neutral" className="font-mono">{testResult.latencyMs} ms</StatusPill> : null}{testResult.success ? <StatusPill tone="neutral">{testResult.extractedCount} item</StatusPill> : null}</div>
                      {testResult.errorMessage ? <p className="mt-1.5 text-[11px] leading-5 text-rose-300">{testResult.errorMessage}</p> : null}
                    </div>
                  </div>

                  {testResult.items.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/70 pt-4 sm:grid-cols-4">
                      {testResult.items.slice(0, 4).map((item, index) => (
                        <div key={`${item.title}-${index}`} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
                          {item.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.coverUrl} alt="" className="h-20 w-full rounded-lg object-cover" />
                          ) : <div className="h-20 rounded-lg bg-zinc-900" />}
                          <p className="mt-2 truncate text-[10px] font-medium text-zinc-300">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-center text-[11px] text-zinc-700">Belum ada hasil live test pada sesi ini.</div>
              )}
            </section>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-800/90 bg-zinc-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-[10px] text-zinc-700">Perubahan disimpan ke konfigurasi source dinamis.</div>
            <div className="flex justify-end gap-2">
              <OpsButton type="button" variant="ghost" onClick={onClose} disabled={saving}>Batal</OpsButton>
              <OpsButton type="submit" variant="primary" disabled={saving || !formData.id || !formData.name || !formData.baseUrl}>{saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}{saving ? "Menyimpan…" : isEditing ? "Simpan perubahan" : "Tambah source"}</OpsButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SelectorField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] text-zinc-500">{label}</label>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 font-mono text-[11px] text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-red-500/45" />
    </div>
  );
}
