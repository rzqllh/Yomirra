"use client";

import React, { useState, useEffect } from "react";
import { 
  MagnifyingGlass, 
  Flame, 
  CircleNotch, 
  SlidersHorizontal,
  CheckCircle,
  WarningCircle,
  Database
} from "@phosphor-icons/react";
import type { SearchIntelligenceStats, SearchSimulationResultItem } from "@/server/lib/search/admin-search-service";

interface SearchTabProps {
  getToken: () => Promise<string | null>;
}

export function SearchTab({ getToken }: SearchTabProps) {
  const [stats, setStats] = useState<SearchIntelligenceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [warming, setWarming] = useState(false);
  const [warmMessage, setWarmMessage] = useState<string | null>(null);

  // Simulator state
  const [simQuery, setSimQuery] = useState("solo leveling");
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<SearchSimulationResultItem[]>([]);
  const [simError, setSimError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/search/stats", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleWarmCatalog = async () => {
    setWarming(true);
    setWarmMessage(null);
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
        setWarmMessage(`Berhasil: ${data.message || `Memanaskan ${data.warmedCount || 0} item`}`);
        await fetchStats();
      } else {
        setWarmMessage(`Gagal: ${data.error || "Gagal memanaskan katalog"}`);
      }
    } catch {
      setWarmMessage("Gagal menghubungi server");
    } finally {
      setWarming(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    setSimulating(true);
    setSimError(null);
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
      } else {
        setSimError(data.error || "Gagal mensimulasikan ranking");
      }
    } catch {
      setSimError("Gagal menghubungi server");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Warm runner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            Search Intelligence & Simulator Ranking
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau katalog pencarian Redis dan uji coba bobot ranking (exact title, sinopsis, tag, popularitas).
          </p>
        </div>
        <button
          onClick={handleWarmCatalog}
          disabled={warming}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition"
        >
          {warming ? (
            <CircleNotch className="w-4 h-4 animate-spin" />
          ) : (
            <Flame className="w-4 h-4" />
          )}
          Warm Search Catalog
        </button>
      </div>

      {warmMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{warmMessage}</span>
        </div>
      )}

      {/* Catalog stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Database className="w-4 h-4 text-indigo-400" />
            Total Item di Katalog
          </div>
          <span className="text-2xl font-bold text-zinc-100">
            {loadingStats ? "..." : stats?.totalCatalogItems ?? 0}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">Tersimpan di cache Redis</span>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <MagnifyingGlass className="w-4 h-4 text-emerald-400" />
            Status Embeddings / Hybrid
          </div>
          <span className="text-base font-semibold text-emerald-400">
            {stats?.embeddingsActive ? "Aktif" : "Hybrid Fallback"}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">Multi-signal query parser</span>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            Terakhir Dipanaskan
          </div>
          <span className="text-sm font-medium text-zinc-300">
            {stats?.lastWarmedAt
              ? new Date(stats.lastWarmedAt).toLocaleString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })
              : "Belum pernah"}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">Warm runner interval</span>
        </div>
      </div>

      {/* Search Ranking Simulator Box */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Uji Simulator Ranking Pencarian</h3>
        <form onSubmit={handleSimulate} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              placeholder="Masukkan query pencarian (contoh: solo leveling, return of mount hua)..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={simulating || !simQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 text-xs font-medium rounded-xl transition"
          >
            {simulating ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Simulasikan"}
          </button>
        </form>

        {simError && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <WarningCircle className="w-4 h-4" />
            <span>{simError}</span>
          </div>
        )}

        {/* Results */}
        {simResults.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Hasil Simulasi Ranking ({simResults.length} item)
            </h4>
            <div className="divide-y divide-zinc-800/60 border border-zinc-800 rounded-xl overflow-hidden">
              {simResults.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-zinc-900/50 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-500 w-5">#{idx + 1}</span>
                      <span className="font-semibold text-zinc-100">{item.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                        {item.sourceId}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 pl-7">
                      <span>Exact Match: <b className="text-zinc-200">{item.exactMatchScore}</b></span>
                      <span>Tag Match: <b className="text-zinc-200">{item.tagMatchScore}</b></span>
                      <span>Popularity: <b className="text-zinc-200">{item.popularityScore}</b></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Final Score</span>
                    <span className="text-sm font-mono font-bold text-indigo-400">
                      {item.finalScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
