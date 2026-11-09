"use client";

import * as React from "react";
import { useSettingsStore } from "@/shared/store/settings-store";
import Link from "next/link";
import Image from "next/image";
import type { MalPopularFeed } from "@/shared/types/mal";
import { getSearchHref } from "@/shared/lib/routes";
import { ArrowRight, Sparkle, ArrowSquareOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function MalPopularSection({
  feed,
  onSwitchToLocal,
}: {
  feed?: MalPopularFeed;
  onSwitchToLocal?: () => void;
}) {
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);

  if (!feed || feed.status !== "ready") {
    return (
      <section
        role="status"
        className="rounded-xl border border-border-subtle bg-surface-raised p-6 sm:p-8 flex flex-col items-center text-center max-w-xl mx-auto shadow-xs"
      >
        <div className="size-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
          <Sparkle size={24} weight="regular" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          Tren MyAnimeList belum terhubung
        </h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {feed?.message ??
            "Snapshot tren eksternal MyAnimeList sedang tidak tersedia atau belum dikonfigurasi. Kamu tetap dapat menikmati peringkat judul populer langsung dari sumber bacaan aktif di Yomirra."}
        </p>
        {onSwitchToLocal && (
          <Button
            type="button"
            variant="primary"
            onClick={onSwitchToLocal}
            className="mt-5 rounded-xl font-bold gap-2 text-sm"
          >
            <span>Jelajahi Populer di Yomirra</span>
            <ArrowRight size={16} />
          </Button>
        )}
      </section>
    );
  }

  const visibleWorks = feed.works.filter((work) => !hideNsfw || work.nsfw === "white");

  return (
    <section aria-labelledby="mal-popular-heading" className="space-y-6">
      <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 shadow-xs">
        <h2 id="mal-popular-heading" aria-label="Populer MAL" className="text-xl font-bold text-text-primary">
          Populer MAL
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          Popularitas eksternal MyAnimeList berdasarkan jumlah pengguna global yang menyimpan judul di perpustakaan MAL. Bukan trafik internal Yomirra.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Peringkat resmi MAL dipertahankan. Snapshot{" "}
          {new Date(feed.fetchedAt).toLocaleDateString("id-ID", {
            dateStyle: "medium",
            timeZone: "Asia/Jakarta",
          })}
          .
        </p>
        <p className="mt-2 text-xs text-text-secondary">
          Cari sumber bacaan untuk memeriksa ketersediaan judul. Masuk peringkat MAL tidak menjamin judul tersedia di sumber Yomirra.
        </p>
      </div>

      {visibleWorks.length === 0 ? (
        <div role="status" className="rounded-xl border border-border-subtle bg-surface-raised p-8 text-center text-text-muted">
          Tidak ada judul yang memenuhi filter konten pada snapshot ini.
        </div>
      ) : (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleWorks.map((work) => (
            <li
              key={work.malId}
              className="flex gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-all hover:border-accent/40 shadow-xs"
            >
              {work.coverUrl && (
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <Image
                    unoptimized
                    src={work.coverUrl}
                    alt=""
                    fill
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-[10.5px] font-bold text-accent">
                    #{work.rank} · MyAnimeList
                  </span>
                  <h3 className="mt-1.5 font-bold text-sm leading-snug text-text-primary line-clamp-2">
                    {work.title}
                  </h3>
                  {work.members !== null && (
                    <p className="mt-1 text-xs text-text-muted">
                      {work.members.toLocaleString("id-ID")} anggota
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-subtle/50 pt-2.5">
                  <Link
                    href={getSearchHref(work.title)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>Cari sumber bacaan</span>
                    <ArrowRight size={12} />
                  </Link>
                  <a
                    href={`https://myanimelist.net/manga/${work.malId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text-primary"
                  >
                    <span>MAL</span>
                    <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex justify-end pt-2">
        <a
          href="https://myanimelist.net/topmanga.php?type=bypopularity"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors underline"
        >
          <span>Sumber data peringkat: MyAnimeList Top Manga</span>
          <ArrowSquareOut size={13} />
        </a>
      </div>
    </section>
  );
}
