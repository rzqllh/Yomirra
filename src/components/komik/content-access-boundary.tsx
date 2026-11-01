"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { MangaItem } from "@/shared/sources/source-types";
import { classifyContent, isContentVisible } from "@/shared/sources/content-policy";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { useSettingsStore } from "@/shared/store/settings-store";

function UnverifiedContentConsent({ children }: { children: ReactNode }) {
  const [acknowledged, setAcknowledged] = useState(false);
  if (!acknowledged) {
    // Do not mount detail/Reader image and data effects before consent.
    return <section role="status" className="grid min-h-[60dvh] place-content-center gap-3 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Rating belum terverifikasi</h1>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
        Sumber belum memberikan klasifikasi konten yang dapat dipastikan. Sampul dan halaman bacaan disembunyikan sampai kamu memilih melanjutkan.
      </p>
      <button
        type="button"
        onClick={() => setAcknowledged(true)}
        className="mx-auto inline-flex min-h-11 items-center rounded-xl border border-border-default px-4 font-semibold text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        Lanjutkan dan tampilkan konten
      </button>
      <Link href="/library" className="mx-auto inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-text-secondary underline">
        Kembali ke Jelajah
      </Link>
    </section>;
  }
  return <>
    <p role="status" className="mx-auto w-full max-w-6xl px-4 py-2 text-sm font-medium text-status-warning-fg">
      Rating belum terverifikasi — klasifikasi konten dari sumber belum tersedia.
    </p>
    {children}
  </>;
}

/** Gate mounted content as well as requests: cached/SSR data may predate opt-out. */
export function ContentAccessBoundary({ sourceId, item, children }: {
  sourceId: string;
  item: Pick<MangaItem, "contentRating" | "isNsfw"> & Partial<Pick<MangaItem, "id">>;
  children: ReactNode;
}) {
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const source = getSourceMetadata(sourceId);
  if (hideNsfw && (source?.isNsfw || !isContentVisible(item, true))) {
    return <section role="status" className="grid min-h-[60dvh] place-content-center gap-3 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Konten disembunyikan</h1>
      <p className="max-w-md text-sm leading-relaxed text-text-secondary">Pengaturan konten saat ini menyembunyikan judul ini.</p>
      <Link href="/library" className="mx-auto inline-flex min-h-11 items-center rounded-xl border border-border-default px-4 font-semibold text-accent focus-visible:outline-2 focus-visible:outline-accent">Kembali ke Jelajah</Link>
    </section>;
  }
  if (hideNsfw && classifyContent(item) === "UNKNOWN") {
    // Key includes exact title identity: never reuse another title's acknowledgement.
    return <UnverifiedContentConsent key={`${sourceId}::${item.id ?? "unspecified"}::${item.contentRating ?? "missing"}`}>
      {children}
    </UnverifiedContentConsent>;
  }
  return children;
}
