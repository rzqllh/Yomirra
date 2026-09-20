"use client";

import * as React from "react";
import { 
  CheckCircle, 
  Warning, 
  Info, 
  XCircle, 
  Sparkle, 
  MagnifyingGlass, 
  Gear, 
  BookmarkSimple, 
  ArrowLeft, 
  ArrowRight, 
  ListBullets, 
  ShieldCheck, 
  Eye,
  DotsThreeVertical,
  CircleNotch
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { FilterChip } from "@/components/ui/filter-chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";

export default function ComponentShowcasePage() {
  const [activeSegment, setActiveSegment] = React.useState("grid");
  const [toggleVal, setToggleVal] = React.useState(true);
  const [chipSelected, setChipSelected] = React.useState(true);
  const [searchValue, setSearchValue] = React.useState("Solo Leveling");

  return (
    <main className="min-h-screen bg-surface-base text-text-primary pb-24">
      {/* Dev Tooling Warning Banner */}
      <div className="bg-semantic-warning/15 border-b border-semantic-warning/30 px-4 py-2 text-center text-xs font-bold text-semantic-warning sticky top-0 z-[var(--z-sticky)] backdrop-blur-md">
        ⚠️ INTERNAL DEV TOOLING — Bukan untuk navigasi publik produksi. Showcase Design System & Hierarchy Matrix Yomirra.
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-12">
        <PageHeader
          title="Component Showcase"
          description="Eksplorasi token, geometri konsentris squircle, dan matriks varian interaksi Yomirra."
          icon={<Sparkle size={24} weight="duotone" />}
        />

        {/* 1. Concentric Squircle Geometry Scale */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h2 className="text-xl font-bold tracking-tight">1. Skala Geometri Squircle Konsentris</h2>
            <p className="text-xs text-text-muted">Hierarki radius terstandarisasi untuk mencegah benturan kurvatur antar kontainer.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: "XS (6px)", cls: "rounded-xs", desc: "Badge, inner tags" },
              { name: "SM (10px)", cls: "rounded-sm", desc: "Chips, buttons sm" },
              { name: "MD (14px)", cls: "rounded-md", desc: "Inputs, item rows" },
              { name: "LG (20px)", cls: "rounded-lg", desc: "Default button, cards" },
              { name: "XL (26px)", cls: "rounded-xl", desc: "Docks, dialogs" },
              { name: "Sheet (32px)", cls: "rounded-sheet", desc: "Bottom sheets" },
            ].map((item) => (
              <div 
                key={item.name} 
                className={`p-4 bg-surface-raised border border-border-default flex flex-col items-center justify-center text-center gap-1.5 shadow-xs ${item.cls}`}
              >
                <span className="font-bold text-xs text-accent">{item.name}</span>
                <span className="text-[10px] text-text-muted">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Semantic Matrix: 9 Variants x 7 States */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h2 className="text-xl font-bold tracking-tight">2. Matriks Hierarki Semantik (9 Varian × 7 Status)</h2>
            <p className="text-xs text-text-muted">Setiap varian memiliki styling eksplisit untuk default, active/pressed, focus, disabled, dan loading.</p>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin] pb-4">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised/40">
                  <th className="p-3 font-bold text-text-muted">Varian Semantik</th>
                  <th className="p-3 font-bold text-text-muted">Default</th>
                  <th className="p-3 font-bold text-text-muted">Selected / Active</th>
                  <th className="p-3 font-bold text-text-muted">Focus-Visible Ring</th>
                  <th className="p-3 font-bold text-text-muted">Disabled</th>
                  <th className="p-3 font-bold text-text-muted">Loading State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {/* 1. Primary / Accent */}
                <tr>
                  <td className="p-3 font-bold text-accent">1. Primary / Accent</td>
                  <td className="p-3"><Button variant="primary" size="sm">Primary</Button></td>
                  <td className="p-3"><Button variant="primary" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="primary" size="sm" className="ring-2 ring-accent ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="primary" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="primary" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 2. Secondary */}
                <tr>
                  <td className="p-3 font-bold text-text-primary">2. Secondary</td>
                  <td className="p-3"><Button variant="secondary" size="sm">Secondary</Button></td>
                  <td className="p-3"><Button variant="secondary" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="secondary" size="sm" className="ring-2 ring-accent ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="secondary" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="secondary" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 3. Ghost */}
                <tr>
                  <td className="p-3 font-bold text-text-secondary">3. Ghost</td>
                  <td className="p-3"><Button variant="ghost" size="sm">Ghost</Button></td>
                  <td className="p-3"><Button variant="ghost" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="ghost" size="sm" className="ring-2 ring-accent ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="ghost" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="ghost" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 4. Glass / Frosted */}
                <tr>
                  <td className="p-3 font-bold text-text-primary">4. Glass / Frosted</td>
                  <td className="p-3"><Button variant="glass" size="sm">Glass</Button></td>
                  <td className="p-3"><Button variant="glass" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="glass" size="sm" className="ring-2 ring-accent ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="glass" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="glass" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 5. Destructive */}
                <tr>
                  <td className="p-3 font-bold text-semantic-error">5. Destructive</td>
                  <td className="p-3"><Button variant="destructive" size="sm">Hapus</Button></td>
                  <td className="p-3"><Button variant="destructive" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="destructive" size="sm" className="ring-2 ring-semantic-error ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="destructive" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="destructive" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 6. Success */}
                <tr>
                  <td className="p-3 font-bold text-semantic-success">6. Success</td>
                  <td className="p-3"><Button variant="success" size="sm">Berhasil</Button></td>
                  <td className="p-3"><Button variant="success" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="success" size="sm" className="ring-2 ring-semantic-success ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="success" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="success" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 7. Warning */}
                <tr>
                  <td className="p-3 font-bold text-semantic-warning">7. Warning</td>
                  <td className="p-3"><Button variant="warning" size="sm">Peringatan</Button></td>
                  <td className="p-3"><Button variant="warning" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="warning" size="sm" className="ring-2 ring-semantic-warning ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="warning" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="warning" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 8. Info */}
                <tr>
                  <td className="p-3 font-bold text-accent">8. Info</td>
                  <td className="p-3"><Button variant="info" size="sm">Informasi</Button></td>
                  <td className="p-3"><Button variant="info" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="info" size="sm" className="ring-2 ring-accent ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="info" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="info" size="sm" loading>Memuat</Button></td>
                </tr>

                {/* 9. Neutral / Muted */}
                <tr>
                  <td className="p-3 font-bold text-text-muted">9. Neutral / Muted</td>
                  <td className="p-3"><Button variant="muted" size="sm">Muted</Button></td>
                  <td className="p-3"><Button variant="muted" size="sm" active>Active</Button></td>
                  <td className="p-3"><Button variant="muted" size="sm" className="ring-2 ring-border-strong ring-offset-2 ring-offset-surface-base">Focused</Button></td>
                  <td className="p-3"><Button variant="muted" size="sm" disabled>Disabled</Button></td>
                  <td className="p-3"><Button variant="muted" size="sm" loading>Memuat</Button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Badges & Tags */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h2 className="text-xl font-bold tracking-tight">3. Badges &amp; Status Indicators</h2>
          </div>
          <div className="flex flex-wrap gap-2.5 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="source">Shinigami</Badge>
            <Badge variant="success">
              <span className="size-1.5 rounded-full bg-current mr-1.5" /> Online
            </Badge>
            <Badge variant="warning">
              <span className="size-1.5 rounded-full bg-current mr-1.5" /> Lambat
            </Badge>
            <Badge variant="error">
              <span className="size-1.5 rounded-full bg-current mr-1.5" /> Gangguan
            </Badge>
            <Badge variant="muted">Manga</Badge>
            <Badge variant="outline">Extension</Badge>
            <Badge variant="accent">Highlighted</Badge>
          </div>
        </section>

        {/* 4. Controls: Toggle, FilterChips, SegmentedControl */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h2 className="text-xl font-bold tracking-tight">4. Kontrol Interaktif (Toggles &amp; Segments)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
              <h3 className="font-bold text-xs text-text-muted uppercase">Segmented Control (Variant 7 Quick Rail)</h3>
              <SegmentedControl
                options={[
                  { value: "grid", label: "Grid View" },
                  { value: "list", label: "List View", badge: "New", badgeVariant: "error" },
                  { value: "compact", label: "Compact", badge: 3 },
                ]}
                value={activeSegment}
                onChange={setActiveSegment}
                variant="quick-rail"
                fullWidth
              />
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
              <h3 className="font-bold text-xs text-text-muted uppercase">Toggle Switch (Lingkaran Thumb Murni)</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Mode Baca Gelap</span>
                <ToggleSwitch checked={toggleVal} onCheckedChange={setToggleVal} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
              <h3 className="font-bold text-xs text-text-muted uppercase">Filter Chip Squircle</h3>
              <div className="flex flex-wrap gap-2">
                <FilterChip 
                  label="Manhwa" 
                  selected={chipSelected} 
                  onToggle={() => setChipSelected(!chipSelected)} 
                />
                <FilterChip label="Completed" />
                <FilterChip label="Action" />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Inputs */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h2 className="text-xl font-bold tracking-tight">5. Input Primitives</h2>
          </div>
          <div className="max-w-md">
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue("")}
              placeholder="Cari judul komik..."
              containerClassName="rounded-2xl"
            />
          </div>
        </section>

        {/* 6. Reader Navigation-First Dock A-004 Preview */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h2 className="text-xl font-bold tracking-tight">6. Reader A-004 Compact Navigation Dock Preview</h2>
            <p className="text-xs text-text-muted">Dock 56px squircle tunggal dengan 4 tombol diskrit: Prev, Daftar Chapter, Next, dan Reader Settings.</p>
          </div>
          <div className="p-6 rounded-3xl bg-black border border-border-subtle/80 flex items-center justify-center">
            <div className="flex items-center justify-between gap-1.5 h-[56px] px-3 max-w-[360px] w-full rounded-[22px] bg-surface-glass backdrop-blur-xl border border-border-glass shadow-heavy">
              <button className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl bg-surface-raised/40 hover:bg-surface-hover text-text-secondary text-xs font-semibold">
                <ArrowLeft size={16} /> <span>Prev</span>
              </button>
              <button className="flex-[1.4] flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-bold shadow-xs">
                <ListBullets size={16} weight="bold" /> <span>Chapter</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl bg-surface-raised/40 hover:bg-surface-hover text-text-secondary text-xs font-semibold">
                <span>Next</span> <ArrowRight size={16} />
              </button>
              <button className="flex size-10 items-center justify-center rounded-xl bg-surface-raised/40 hover:bg-surface-hover text-text-secondary">
                <Gear size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
