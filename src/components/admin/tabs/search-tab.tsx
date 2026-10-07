"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CircleNotch,
  Database,
  Flame,
  MagnifyingGlass,
  SlidersHorizontal,
  WarningCircle,
} from "@phosphor-icons/react";
import type { SearchIntelligenceStats, SearchSimulationResultItem } from "@/shared/types/admin";
import {
  EmptyState,
  FeedbackBanner,
  InlineNotice,
  MetricCell,
  OpsButton,
  OpsCard,
  OpsSectionHeader,
  StatusPill,
} from "../components/admin-ui";

interface SearchTabProps {
  getToken: () => Promise<string | null>;
}

export function SearchTab({ getToken }: SearchTabProps) {
  const [stats, setStats] = useState<SearchIntelligenceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [warming, setWarming] = useState(false);
  const [warmFeedback, setWarmFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const [simQuery, setSimQuery] = useState("solo leveling");
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<SearchSimulationResultItem[]>([]);
  const [simError, setSimError] = useState<string | null>(null);
  const [simCatalogEmpty, setSimCatalogEmpty] = useState(false);
  const [simDone, setSimDone] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/search/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.stats) setStats(data.stats);
    } finally {
      setLoadingStats(false);
    }
  }, [getToken]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleWarmCatalog = async () => {
    setWarming(true);
    setWarmFeedback(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/search/warm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setWarmFeedback({ text: data.message || `Catalog warm selesai untuk ${data.warmedCount || 0} item.`, ok: true });
        await fetchStats();
      } else {
        setWarmFeedback({ text: data.error || "Gagal memanaskan search catalog.", ok: false });
      }
    } catch {
      setWarmFeedback({ text: "Server tidak dapat dihubungi saat warming catalog.", ok: false });
    } finally {
      setWarming(false);
    }
  };

  const handleSimulate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!simQuery.trim()) return;

    setSimulating(true);
    setSimError(null);
    setSimDone(false);
    setSimCatalogEmpty(false);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/search/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: simQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimResults(data.results || []);
        setSimCatalogEmpty(Boolean(data.catalogEmpty));
        setSimDone(true);
      } else {
        setSimError(data.error || "Ranking simulator gagal dijalankan.");
      }
    } catch {
      setSimError("Server tidak dapat dihubungi saat menjalankan simulator.");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <OpsSectionHeader
        eyebrow="Discovery diagnostics"
        title="Search Lab"
        description="Uji ranking secara terisolasi, inspeksi sinyal scoring, dan kelola warm catalog tanpa masuk ke reader publik."
        action={
          <OpsButton type="button" variant="secondary" onClick={() => void handleWarmCatalog()} disabled={warming}>
            {warming ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4 text-red-400" />}
            Warm catalog
          </OpsButton>
        }
      />

      {warmFeedback ? <FeedbackBanner message={warmFeedback.text} ok={warmFeedback.ok} onDismiss={() => setWarmFeedback(null)} /> : null}

      <OpsCard className="overflow-hidden">
        <div className="grid divide-y divide-zinc-800/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricCell label="Catalog items" value={loadingStats ? "…" : stats?.totalCatalogItems ?? 0} hint="Item yang tersedia pada search cache" />
          <MetricCell label="Search mode" value={stats?.embeddingsActive ? "Embeddings" : "Hybrid fallback"} hint="Multi-signal query parser" tone={stats?.embeddingsActive ? "success" : "warning"} />
          <MetricCell
            label="Last warm"
            value={stats?.lastWarmedAt ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(stats.lastWarmedAt)) : "Never"}
            hint="Waktu terakhir catalog dipanaskan"
          />
        </div>
      </OpsCard>

      <OpsCard className="overflow-hidden">
        <div className="border-b border-zinc-800/80 px-4 py-4 sm:px-5">
          <OpsSectionHeader
            eyebrow="Ranking sandbox"
            title="Query simulator"
            description="Menjalankan ranking admin terhadap catalog saat ini tanpa mengubah state pencarian publik."
          />
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={handleSimulate} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700" />
              <input
                type="search"
                value={simQuery}
                onChange={(event) => setSimQuery(event.target.value)}
                placeholder="Contoh: solo leveling"
                className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-9 pr-3 text-xs text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10"
              />
            </div>
            <OpsButton type="submit" variant="primary" className="h-10 px-4" disabled={simulating || !simQuery.trim()}>
              {simulating ? <CircleNotch className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
              Run simulation
            </OpsButton>
          </form>

          <div className="mt-4 space-y-3">
            {simCatalogEmpty && simDone ? (
              <InlineNotice tone="warning">
                Catalog Redis kosong. Hasil menggunakan metadata source statis, jadi hasil ini tidak mewakili catalog production penuh.
              </InlineNotice>
            ) : null}
            {simError ? <InlineNotice tone="danger">{simError}</InlineNotice> : null}
          </div>
        </div>

        {simResults.length > 0 ? (
          <div className="border-t border-zinc-800/80">
            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-medium text-zinc-300">Ranking result</p>
                <p className="mt-0.5 text-[10px] text-zinc-700">{simResults.length} result · query “{simQuery}”</p>
              </div>
              <StatusPill tone="brand">Simulation</StatusPill>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-y border-zinc-800/80 bg-zinc-950/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                  <tr>
                    <th className="w-14 px-5 py-2.5">Rank</th>
                    <th className="px-3 py-2.5">Title</th>
                    <th className="w-28 px-3 py-2.5">Source</th>
                    <th className="w-28 px-3 py-2.5 text-right">Exact</th>
                    <th className="w-28 px-3 py-2.5 text-right">Tag</th>
                    <th className="w-28 px-3 py-2.5 text-right">Popularity</th>
                    <th className="w-28 px-5 py-2.5 text-right">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {simResults.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-zinc-900/55">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-700">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-3 text-xs font-medium text-zinc-200">{item.title}</td>
                      <td className="px-3 py-3"><StatusPill tone="neutral" className="font-mono uppercase">{item.sourceId}</StatusPill></td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] tabular-nums text-zinc-500">{item.exactMatchScore}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] tabular-nums text-zinc-500">{item.tagMatchScore}</td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] tabular-nums text-zinc-500">{item.popularityScore}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs font-semibold tabular-nums text-red-300">{item.finalScore.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-800/80 md:hidden">
              {simResults.map((item, index) => (
                <div key={item.id || index} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-zinc-700">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-zinc-200">{item.title}</p>
                        <StatusPill tone="neutral" className="font-mono uppercase">{item.sourceId}</StatusPill>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-zinc-600">
                        <span>Exact <b className="font-mono text-zinc-400">{item.exactMatchScore}</b></span>
                        <span>Tag <b className="font-mono text-zinc-400">{item.tagMatchScore}</b></span>
                        <span>Pop <b className="font-mono text-zinc-400">{item.popularityScore}</b></span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-red-300">{item.finalScore.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : simDone && !simError ? (
          <div className="border-t border-zinc-800/80">
            <EmptyState icon={<Database className="h-5 w-5" />} title="Tidak ada hasil" description={`Query “${simQuery}” tidak mengembalikan kandidat ranking.`} />
          </div>
        ) : (
          <div className="border-t border-zinc-800/80 px-5 py-8 text-center">
            <WarningCircle className="mx-auto h-5 w-5 text-zinc-800" />
            <p className="mt-2 text-xs text-zinc-700">Jalankan query untuk melihat breakdown ranking.</p>
          </div>
        )}
      </OpsCard>
    </div>
  );
}
