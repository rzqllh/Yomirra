"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  CircleNotch,
  Code,
  FloppyDisk,
  Globe,
  Lightning,
  Question,
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

interface SelectorPreset {
  id: string;
  name: string;
  description: string;
  selectors: NonNullable<CustomSourceDefinition["selectors"]>;
}

const SELECTOR_PRESETS: Record<string, SelectorPreset> = {
  themesia: {
    id: "themesia",
    name: "WordPress Themesia (Komikcast, Westmanga, Shinigami)",
    description: "Digunakan oleh ~80% situs komik Indonesia berbasis CMS MangaThemesia.",
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
  },
  madara: {
    id: "madara",
    name: "Madara Theme (MangaSY, ManhuaUS, AquaManga)",
    description: "Digunakan oleh tema WordPress Madara / WP Manga populer global.",
    selectors: {
      popularPath: "/manga/?m_orderby=views",
      popularListSelector: ".page-item-detail, .c-tabs-item__content",
      titleSelector: ".post-title h3 a, .post-title a",
      coverSelector: "img",
      linkSelector: "a",
      chapterListSelector: ".wp-manga-chapter",
      chapterTitleSelector: "a",
      pagesSelector: ".reading-content img",
    },
  },
  mangastream: {
    id: "mangastream",
    name: "MangaStream CMS (AsuraScans, ReaperScans style)",
    description: "Digunakan oleh situs scanlation bertema MangaStream klasik.",
    selectors: {
      popularPath: "/comics?order=popular",
      popularListSelector: ".bsx",
      titleSelector: ".tt",
      coverSelector: "img",
      linkSelector: "a",
      chapterListSelector: ".clxs li",
      chapterTitleSelector: ".lchx a",
      pagesSelector: "#readerarea img",
    },
  },
};

interface SelectorHelpInfo {
  title: string;
  meaning: string;
  inspectGuide: string;
  htmlExample: string;
  suggestions: string[];
}

const SELECTOR_HELP: Record<string, SelectorHelpInfo> = {
  popularPath: {
    title: "Popular Path",
    meaning: "Sub-path URL setelah nama domain untuk membuka halaman daftar atau katalog manga terpopuler.",
    inspectGuide: "Buka web manga di browser -> klik menu 'Daftar Komik' atau 'Popular' -> salin bagian URL setelah domain (contoh: https://komikcast.cx/daftar-komik?order=popular -> salin '/daftar-komik?order=popular').",
    htmlExample: "https://domain.com/daftar-komik?order=popular",
    suggestions: ["/daftar-komik?order=popular", "/manga/?m_orderby=views", "/komik?order=popular", "/series?order=popular"],
  },
  popularListSelector: {
    title: "List Item (Wadah Kartu Komik)",
    meaning: "CSS Selector untuk satu elemen card atau wadah kartu manga di dalam daftar katalog.",
    inspectGuide: "Tekan F12 -> klik ikon panah Inspect Element (pojok kiri atas DevTools) -> sorot SATU kotak kartu komik. Cari tag <div> kartu tersebut dan salin nama class-nya.",
    htmlExample: '<div class="list-update_item">\n  <a href="/manga/one-piece">\n    <img src="cover.jpg" />\n    <h3 class="title">One Piece</h3>\n  </a>\n</div>',
    suggestions: [".list-update_item", ".page-item-detail", ".bsx", ".animepost", ".manga-card"],
  },
  titleSelector: {
    title: "Title (Tag Judul Komik)",
    meaning: "CSS Selector untuk tag teks nama judul manga di dalam kartu komik tersebut.",
    inspectGuide: "Di dalam kartu komik yang sama, sorot teks judulnya dengan Inspect Element. Biasanya berupa tag <h3>, <h4>, atau <a> dengan class tertentu.",
    htmlExample: '<h3 class="title">One Piece</h3>\n<!-- Selector-nya: h3.title atau .title -->',
    suggestions: ["h3.title", ".title", ".post-title a", "h4", "h2.entry-title"],
  },
  coverSelector: {
    title: "Cover Image (Gambar Sampul)",
    meaning: "CSS Selector untuk tag gambar thumbnail cover manga di dalam kartu komik.",
    inspectGuide: "Sorot gambar sampul di kartu komik. Scraper Yomirra akan otomatis membaca atribut 'src' atau 'data-src' dari tag ini.",
    htmlExample: '<img src="https://.../cover.webp" class="ts-post-image" />\n<!-- Selector-nya: img -->',
    suggestions: ["img", ".thumbnail img", ".limit img", "img.wp-post-image"],
  },
  chapterListSelector: {
    title: "Chapter List (Baris Bab)",
    meaning: "CSS Selector untuk setiap baris daftar chapter di halaman detail komik.",
    inspectGuide: "Buka halaman detail salah satu komik di browser -> tekan F12 -> sorot satu baris chapter dalam list. Biasanya berada di dalam tag <ul> atau <div>.",
    htmlExample: '<ul class="chapter-list">\n  <li><a href="/one-piece-ch-1100">Chapter 1100</a></li>\n</ul>\n<!-- Selector-nya: .chapter-list li -->',
    suggestions: [".chapter-list li", ".wp-manga-chapter", ".clxs li", "#chapterlist li"],
  },
  pagesSelector: {
    title: "Reader Pages (Gambar Halaman Chapter)",
    meaning: "CSS Selector untuk semua tag gambar halaman ketika sebuah chapter dibuka untuk dibaca.",
    inspectGuide: "Buka satu chapter komik hingga semua gambar halaman muncul -> tekan F12 -> sorot salah satu gambar halaman baca. Perhatikan id atau class dari wadah pembungkusnya.",
    htmlExample: '<div id="readerarea">\n  <img src="page-01.jpg" />\n  <img src="page-02.jpg" />\n</div>\n<!-- Selector-nya: #readerarea img -->',
    suggestions: ["#readerarea img", ".reading-content img", "#chimg img", ".image-container img"],
  },
};

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

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

export function CustomSourceModal({ initialSource, isOpen, onClose, onSaved, getToken }: CustomSourceModalProps) {
  const isEditing = Boolean(initialSource);
  const [formData, setFormData] = useState<CustomSourceDefinition>(initialSource || EMPTY_SOURCE);
  const [mirrorsText, setMirrorsText] = useState((initialSource?.mirrors || []).join("\n"));
  const [selectedPreset, setSelectedPreset] = useState<string>("themesia");
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
    setSelectedPreset("themesia");
    setTestResult(null);
    setError(null);
  }, [initialSource, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey === "custom") return;
    const preset = SELECTOR_PRESETS[presetKey];
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        selectors: { ...preset.selectors },
      }));
    }
  };

  const handleBaseUrlBlur = () => {
    if (formData.baseUrl) {
      const clean = normalizeUrl(formData.baseUrl);
      if (clean !== formData.baseUrl) {
        setFormData((prev) => ({ ...prev, baseUrl: clean }));
      }
    }
  };

  const handleTestParser = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    const cleanBaseUrl = normalizeUrl(formData.baseUrl);
    const updatedFormData = { ...formData, baseUrl: cleanBaseUrl };
    if (cleanBaseUrl !== formData.baseUrl) {
      setFormData(updatedFormData);
    }

    try {
      const token = await getToken();
      const mirrors = mirrorsText.split("\n").map((value) => value.trim()).filter(Boolean);
      const res = await fetch("/api/admin/sources/custom/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...updatedFormData, mirrors }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setTestResult(data.result);
      } else {
        setError(data.error || "Parser test gagal dijalankan.");
      }
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

    const cleanBaseUrl = normalizeUrl(formData.baseUrl);
    try {
      const token = await getToken();
      const mirrors = mirrorsText.split("\n").map((value) => value.trim()).filter(Boolean);
      const payload = {
        ...formData,
        baseUrl: cleanBaseUrl,
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-400/90">Dynamic source studio</p>
              <h2 id="custom-source-title" className="mt-1 truncate text-base font-semibold text-zinc-100">
                {isEditing ? `Edit ${formData.name || formData.id}` : "Tambah custom source"}
              </h2>
              <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                Konfigurasi adapter HTML/API dan validasi parser sebelum disimpan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {error ? <FeedbackBanner message={error} ok={false} onDismiss={() => setError(null)} /> : null}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Identity & endpoint</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">Metadata utama untuk mengenali source dan upstream.</p>
                </div>
                <StatusPill tone={formData.isEnabled ? "success" : "neutral"} dot>
                  {formData.isEnabled ? "Enabled" : "Disabled"}
                </StatusPill>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="custom-source-id" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Source ID (Slug)
                  </label>
                  <input
                    id="custom-source-id"
                    type="text"
                    disabled={isEditing}
                    required
                    value={formData.id}
                    onChange={(event) => setFormData({ ...formData, id: event.target.value })}
                    placeholder="komikcast"
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="custom-source-name" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Display name
                  </label>
                  <input
                    id="custom-source-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="Komikcast ID"
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="custom-base-url" className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <Globe className="h-3.5 w-3.5 text-zinc-600" />
                    Base URL
                  </label>
                  <span className="text-[10px] text-zinc-500">Auto-prefix https:// aktif</span>
                </div>
                <input
                  id="custom-base-url"
                  type="text"
                  required
                  value={formData.baseUrl}
                  onChange={(event) => setFormData({ ...formData, baseUrl: event.target.value })}
                  onBlur={handleBaseUrlBlur}
                  placeholder="https://source.example atau source.example"
                  className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                />
              </div>

              <div>
                <label htmlFor="custom-mirrors" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                  Mirror domains (Opsional)
                </label>
                <textarea
                  id="custom-mirrors"
                  rows={2}
                  value={mirrorsText}
                  onChange={(event) => setMirrorsText(event.target.value)}
                  placeholder={"https://mirror-one.example\nhttps://mirror-two.example"}
                  className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 font-mono text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
                />
                <p className="mt-1 text-[10px] text-zinc-600">Satu URL per baris jika upstream memiliki domain cadangan.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label htmlFor="custom-type" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Parser
                  </label>
                  <OpsSelect
                    id="custom-type"
                    value={formData.type}
                    onChange={(event) => setFormData({ ...formData, type: event.target.value as "html" | "api" })}
                  >
                    <option value="html" className="bg-zinc-900 text-zinc-200">HTML (Scraping)</option>
                    <option value="api" className="bg-zinc-900 text-zinc-200">REST API</option>
                  </OpsSelect>
                </div>
                <div>
                  <label htmlFor="custom-lang" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Language
                  </label>
                  <input
                    id="custom-lang"
                    type="text"
                    maxLength={2}
                    value={formData.lang}
                    onChange={(event) => setFormData({ ...formData, lang: event.target.value })}
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 text-xs uppercase text-zinc-200 outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="custom-enabled" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Status
                  </label>
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
                  <label htmlFor="custom-nsfw" className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Content
                  </label>
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
                <div className="flex flex-col gap-2.5 border-b border-zinc-800/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-red-400" />
                      <p className="text-xs font-semibold text-zinc-200">HTML selector contract</p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      Selector CSS yang digunakan Cheerio. Klik tombol <strong>Cara isi</strong> pada tiap label untuk melihat tutorial inspect F12.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="selector-preset-select" className="shrink-0 text-[10px] font-medium text-zinc-400">
                      Preset CMS:
                    </label>
                    <div className="w-56">
                      <OpsSelect
                        id="selector-preset-select"
                        value={selectedPreset}
                        onChange={(e) => handleApplyPreset(e.target.value)}
                        className="!h-8 !text-[11px]"
                      >
                        <option value="themesia" className="bg-zinc-900 text-zinc-200">Themesia (Komikcast, Westmanga)</option>
                        <option value="madara" className="bg-zinc-900 text-zinc-200">Madara Theme (MangaSY, ManhuaUS)</option>
                        <option value="mangastream" className="bg-zinc-900 text-zinc-200">MangaStream (Asura / Reaper)</option>
                        <option value="custom" className="bg-zinc-900 text-zinc-200">Kustom (Isi Manual)</option>
                      </OpsSelect>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3.5 p-4 sm:grid-cols-2">
                  <SelectorFieldWithHelp
                    fieldKey="popularPath"
                    label="Popular path"
                    value={formData.selectors?.popularPath || ""}
                    placeholder="/daftar-komik?order=popular"
                    onChange={(value) => {
                      setSelectedPreset("custom");
                      setFormData({
                        ...formData,
                        selectors: { ...formData.selectors!, popularPath: value },
                      });
                    }}
                  />
                  <SelectorFieldWithHelp
                    fieldKey="popularListSelector"
                    label="List item (Card container)"
                    value={formData.selectors?.popularListSelector || ""}
                    placeholder=".list-update_item"
                    onChange={(value) => {
                      setSelectedPreset("custom");
                      setFormData({
                        ...formData,
                        selectors: { ...formData.selectors!, popularListSelector: value },
                      });
                    }}
                  />
                  <SelectorFieldWithHelp
                    fieldKey="titleSelector"
                    label="Title (Judul komik)"
                    value={formData.selectors?.titleSelector || ""}
                    placeholder="h3.title"
                    onChange={(value) => {
                      setSelectedPreset("custom");
                      setFormData({
                        ...formData,
                        selectors: { ...formData.selectors!, titleSelector: value },
                      });
                    }}
                  />
                  <SelectorFieldWithHelp
                    fieldKey="coverSelector"
                    label="Cover image"
                    value={formData.selectors?.coverSelector || ""}
                    placeholder="img"
                    onChange={(value) => {
                      setSelectedPreset("custom");
                      setFormData({
                        ...formData,
                        selectors: { ...formData.selectors!, coverSelector: value },
                      });
                    }}
                  />
                  <SelectorFieldWithHelp
                    fieldKey="chapterListSelector"
                    label="Chapter list"
                    value={formData.selectors?.chapterListSelector || ""}
                    placeholder=".chapter-list li"
                    onChange={(value) => {
                      setSelectedPreset("custom");
                      setFormData({
                        ...formData,
                        selectors: { ...formData.selectors!, chapterListSelector: value },
                      });
                    }}
                  />
                  <SelectorFieldWithHelp
                    fieldKey="pagesSelector"
                    label="Reader pages"
                    value={formData.selectors?.pagesSelector || ""}
                    placeholder="#readerarea img"
                    onChange={(value) => {
                      setSelectedPreset("custom");
                      setFormData({
                        ...formData,
                        selectors: { ...formData.selectors!, pagesSelector: value },
                      });
                    }}
                  />
                </div>
              </section>
            ) : (
              <InlineNotice tone="neutral">
                REST API mode memakai kontrak endpoint JSON bawaan service. Selector HTML tidak digunakan.
              </InlineNotice>
            )}

            <section className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Parser validation</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    Jalankan live test untuk menguji selector CSS langsung ke website target sebelum disimpan.
                  </p>
                </div>
                <OpsButton
                  type="button"
                  variant="secondary"
                  onClick={() => void handleTestParser()}
                  disabled={testing || !formData.baseUrl}
                >
                  {testing ? (
                    <CircleNotch className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lightning className="h-4 w-4 text-amber-400" />
                  )}
                  Run live test
                </OpsButton>
              </div>

              {testResult ? (
                <div
                  className={cx(
                    "rounded-2xl border p-4",
                    testResult.success
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-rose-500/25 bg-rose-500/[0.06]",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {testResult.success ? (
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" weight="fill" />
                    ) : (
                      <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" weight="fill" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cx("text-xs font-medium", testResult.success ? "text-emerald-200" : "text-rose-200")}>
                          {testResult.success ? "Parser test passed (Live scraping berhasil)" : "Parser test failed"}
                        </p>
                        {testResult.success ? (
                          <StatusPill tone="neutral" className="font-mono">
                            {testResult.latencyMs} ms
                          </StatusPill>
                        ) : null}
                        {testResult.success ? (
                          <StatusPill tone="neutral">
                            {testResult.extractedCount} item ditemukan
                          </StatusPill>
                        ) : null}
                      </div>
                      {testResult.errorMessage ? (
                        <p className="mt-1.5 text-[11px] leading-5 text-rose-300">{testResult.errorMessage}</p>
                      ) : null}
                    </div>
                  </div>

                  {testResult.items.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/70 pt-4 sm:grid-cols-4">
                      {testResult.items.slice(0, 4).map((item, index) => (
                        <div key={`${item.title}-${index}`} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
                          {item.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.coverUrl} alt="" className="h-20 w-full rounded-lg object-cover" />
                          ) : (
                            <div className="h-20 rounded-lg bg-zinc-900" />
                          )}
                          <p className="mt-2 truncate text-[10px] font-medium text-zinc-300">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-center text-[11px] text-zinc-600">
                  Belum ada hasil live test pada sesi ini. Masukkan Base URL dan klik <strong>Run live test</strong> di atas.
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-800/90 bg-zinc-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-[10px] text-zinc-500">
              Perubahan disimpan ke runtime registry dan disinkronkan ke cache.
            </div>
            <div className="flex justify-end gap-2">
              <OpsButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
                Batal
              </OpsButton>
              <OpsButton
                type="submit"
                variant="primary"
                disabled={saving || !formData.id || !formData.name || !formData.baseUrl}
              >
                {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
                {saving ? "Menyimpan…" : isEditing ? "Simpan perubahan" : "Tambah source"}
              </OpsButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SelectorFieldWithHelp({
  fieldKey,
  label,
  value,
  placeholder,
  onChange,
}: {
  fieldKey: keyof typeof SELECTOR_HELP;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const help = SELECTOR_HELP[fieldKey];

  return (
    <div className="relative">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="font-mono text-[10px] font-medium text-zinc-400">{label}</label>
        {help ? (
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
            title={`Panduan cara mengisi ${help.title}`}
          >
            <Question className="h-3 w-3" />
            <span className="text-[9px]">Cara isi</span>
          </button>
        ) : null}
      </div>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-2.5 font-mono text-[11px] text-zinc-200 outline-none placeholder:text-zinc-700 transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
      />

      {showHelp && help ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl border border-zinc-700 bg-zinc-900 p-3.5 shadow-2xl shadow-black/80">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
            <div>
              <p className="text-xs font-semibold text-zinc-100">{help.title}</p>
              <p className="text-[10px] text-zinc-400">{help.meaning}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Tutup panduan"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5 text-[10px] text-zinc-300">
            <div>
              <p className="font-semibold text-amber-400/90">🔍 Cara Cek di F12 (Inspect Element):</p>
              <p className="mt-0.5 leading-relaxed text-zinc-400">{help.inspectGuide}</p>
            </div>

            <div>
              <p className="font-semibold text-zinc-400">📄 Contoh Kode HTML di Browser:</p>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2 font-mono text-[10px] text-emerald-400/90 whitespace-pre-wrap">
                {help.htmlExample}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-zinc-400">💡 Saran Nilai Umum (Klik untuk pasang):</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {help.suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      onChange(sug);
                      setShowHelp(false);
                    }}
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-red-300 transition hover:border-red-500/40 hover:bg-red-500/10"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
