"use client";
import { useSettingsStore } from "@/shared/store/settings-store";
import Link from "next/link";
import Image from "next/image";
import type { MalPopularFeed } from "@/shared/types/mal";
import { getSearchHref } from "@/shared/lib/routes";
export function MalPopularSection({ feed }: { feed: MalPopularFeed }) {
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  if (feed.status !== "ready") return <section role="status" className="rounded-2xl border border-border-subtle bg-surface-raised p-6"><h2 className="text-lg font-bold">Populer MAL belum tersedia</h2><p className="mt-2 text-sm text-text-secondary">{feed.message}</p><p className="mt-2 text-xs text-text-muted">Pilih Populer di Yomirra untuk melanjutkan jelajah.</p></section>;
  const visibleWorks = feed.works.filter(work => !hideNsfw || work.nsfw === "white");
  return <section aria-labelledby="mal-popular-heading" className="space-y-5">
    <div><h2 id="mal-popular-heading" className="text-xl font-bold">Populer MAL</h2><p className="mt-2 text-sm text-text-secondary">Popularitas eksternal MyAnimeList berdasarkan jumlah anggota yang menyimpan judul. Bukan trafik Yomirra.</p><p className="mt-1 text-xs text-text-muted">Peringkat asli dipertahankan setelah penyaringan kategori dan konten. Metadata tidak menjamin chapter tersedia di sumber baca. Snapshot {new Date(feed.fetchedAt).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })}.</p></div>
    {visibleWorks.length === 0 ? <p role="status" className="py-8 text-text-muted">Tidak ada judul yang memenuhi filter konten pada snapshot ini.</p> : <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleWorks.map(work => <li key={work.malId} className="flex gap-4 rounded-2xl border border-border-subtle bg-surface-raised p-4">
      {work.coverUrl && <Image unoptimized src={work.coverUrl} alt="" width={72} height={100} loading="lazy" className="h-24 w-[72px] shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0"><p className="text-xs font-semibold text-accent">#{work.rank} · MyAnimeList</p><h3 className="mt-1 font-bold leading-snug">{work.title}</h3>{work.members !== null && <p className="mt-1 text-xs text-text-muted">{work.members.toLocaleString("id-ID")} anggota</p>}<div className="mt-2 flex flex-wrap gap-x-4"><Link href={getSearchHref(work.title)} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent">Cari sumber bacaan</Link><a href={`https://myanimelist.net/manga/${work.malId}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs text-text-secondary">Lihat di MAL ↗</a></div></div>
    </li>)}</ol>}
    <a href="https://myanimelist.net/topmanga.php?type=bypopularity" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs text-text-muted underline">Sumber peringkat: MyAnimeList</a>
  </section>;
}
