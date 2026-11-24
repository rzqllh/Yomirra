"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { initFirebase } from "@/shared/lib/firebase";
import { Button } from "@/components/ui/button";
import { PrivateBetaReader } from "./private-beta-reader";

type Candidate = { id: string; name: string; available: boolean };
type Catalog = { items: { id: string; title: string; format?: string }[]; received: number; page: number; hasNextPage: boolean };
type CatalogMode = "popular" | "latest" | "search";

async function betaRequest(user: User, signal: AbortSignal, params = "") {
  const { auth } = await initFirebase();
  if (auth?.currentUser?.uid !== user.uid) throw new Error("Account changed");
  const token = await user.getIdToken();
  if (signal.aborted || auth.currentUser?.uid !== user.uid) throw new Error("Account changed");
  const response = await fetch("/api/private-beta/sources" + params, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  if (signal.aborted || auth.currentUser?.uid !== user.uid) throw new Error("Account changed");
  if (!response.ok) throw new Error("Private beta unavailable");
  return response.json();
}

/** This component owns no shared query/cache/store data. Its parent keys it
 * by Firebase UID so switching accounts discards the entire workspace. */
export function PrivateBetaPanel({ user }: { user: User }) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CatalogMode>("popular");
  const [executedQuery, setExecutedQuery] = useState("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedManga, setSelectedManga] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      const { auth } = await initFirebase();
      if (controller.signal.aborted || !auth || auth.currentUser?.uid !== user.uid) return;
      const { onAuthStateChanged } = await import("firebase/auth");
      if (controller.signal.aborted) return;
      unsubscribe = onAuthStateChanged(auth, current => {
        if (current?.uid !== user.uid) {
          controller.abort();
          requestRef.current?.abort();
          setCandidates(null);
          setCatalog(null);
          setSelectedManga(null);
        }
      });
      const body = await betaRequest(user, controller.signal);
      if (!controller.signal.aborted && Array.isArray(body.data)) setCandidates(body.data);
    })().catch(() => undefined);
    return () => { controller.abort(); requestRef.current?.abort(); unsubscribe?.(); };
  }, [user]);

  if (!candidates) return null;
  const load = async (id: string, text: string, nextMode: CatalogMode = text.trim() ? "search" : "popular", page = 1) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setSelected(id); setMode(nextMode); setExecutedQuery(text.trim()); setBusy(true); setFailed(false); setCatalog(null); setSelectedManga(null);
    try {
      const params = "?" + new URLSearchParams({source:id,q:text.trim(),mode:nextMode,page:String(page)}).toString();
      const body = await betaRequest(user, controller.signal, params);
      if (!controller.signal.aborted) setCatalog(body.data);
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return (
    <section aria-label="Beta privat" className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
      <h2 className="text-lg font-bold text-text-primary">Beta privat</h2>
      <p className="text-sm text-text-secondary">Katalog pengujian khusus akun ini. Tidak memengaruhi sumber publik, Library, atau riwayat baca.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {candidates.map(source => (
          <div key={source.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle p-3">
            <div>
              <p className="text-sm font-semibold">{source.name}</p>
              <p className="text-xs text-text-secondary">{source.available ? "Uji katalog tersedia" : "Izin akses upstream belum dikonfigurasi"}</p>
            </div>
            <Button disabled={!source.available || busy} onClick={() => void load(source.id, "")}>Uji katalog</Button>
          </div>
        ))}
      </div>
      {selected && (
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === "popular" ? "primary" : "outline"} disabled={busy} onClick={() => void load(selected, "", "popular")}>Populer</Button>
          <Button variant={mode === "latest" ? "primary" : "outline"} disabled={busy} onClick={() => void load(selected, "", "latest")}>Terbaru</Button>
        </div>
      )}
      {selected && (
        <form className="flex gap-2" onSubmit={event => { event.preventDefault(); if (query.trim()) void load(selected, query, "search"); }}>
          <input aria-label="Cari judul beta" className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface-base px-3 py-2 text-sm" value={query} maxLength={160} onChange={event => setQuery(event.target.value)} />
          <Button type="submit" disabled={busy || !query.trim()}>Cari</Button>
        </form>
      )}
      {busy && <p role="status" className="text-sm text-text-secondary">Memeriksa katalog…</p>}
      {failed && <p role="alert" className="text-sm text-semantic-error">Pemeriksaan gagal. Coba lagi nanti.</p>}
      {selectedManga && selected && <PrivateBetaReader key={JSON.stringify([user.uid,selected,selectedManga])} user={user} source={selected} mangaId={selectedManga} onClose={() => setSelectedManga(null)} />}
      {catalog && <div aria-live="polite">
        <p className="text-xs text-text-secondary">{catalog.items.length} judul dengan klasifikasi aman dari {catalog.received} hasil. Rating yang belum terverifikasi tidak menandakan adapter rusak.</p>
        <ul className="mt-2 divide-y divide-border-subtle">
          {catalog.items.map((item, index) => <li key={JSON.stringify([item.id,index])} className="py-2 text-sm"><button type="button" className="text-left font-semibold hover:underline" onClick={() => setSelectedManga(item.id)}>{item.title}{item.format ? ` · ${item.format}` : ""}</button></li>)}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="outline" disabled={busy || catalog.page <= 1} onClick={() => void load(selected, executedQuery, mode, catalog.page - 1)}>Sebelumnya</Button>
          <span className="text-xs text-text-secondary">Halaman {catalog.page}</span>
          <Button variant="outline" disabled={busy || !catalog.hasNextPage} onClick={() => void load(selected, executedQuery, mode, catalog.page + 1)}>Berikutnya</Button>
        </div>
      </div>}
    </section>
  );
}
