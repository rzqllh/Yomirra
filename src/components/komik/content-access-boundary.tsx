"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { MangaItem } from "@/shared/sources/source-types";
import { isContentVisible } from "@/shared/sources/content-policy";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { useSettingsStore } from "@/shared/store/settings-store";

/** Gate mounted content as well as requests: cached/SSR data may predate opt-out. */
export function ContentAccessBoundary({ sourceId, item, children }: {
  sourceId: string;
  item: Pick<MangaItem, "contentRating" | "isNsfw">;
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
  return children;
}
