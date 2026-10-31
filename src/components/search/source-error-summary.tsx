"use client";

import * as React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import type { SourceMetadata } from "@/shared/sources/source-types";

export function getFriendlySourceError(error: string): string {
  const msg = error.toLowerCase();
  if (["timeout", "aborted", "fetch failed", "econnrefused"].some((fragment) => msg.includes(fragment))) {
    return "belum bisa dihubungi";
  }
  if (["cloudflare", "503", "403"].some((fragment) => msg.includes(fragment))) {
    return "sementara menolak permintaan";
  }
  if (["parser", "cheerio", "selector", "parse"].some((fragment) => msg.includes(fragment))) {
    return "sedang bermasalah";
  }
  return "gagal dimuat";
}

interface SearchSourceErrorSummaryProps {
  errors: Array<{ sourceId: string; error: string }>;
  sources: SourceMetadata[];
}

/**
 * Partial failures must not dominate the results. A native details control
 * exposes provider-specific diagnostics on demand while keeping valid results visible.
 */
export function SearchSourceErrorSummary({ errors, sources }: SearchSourceErrorSummaryProps) {
  if (errors.length === 0) return null;

  const sourceNames = new Map(sources.map((source) => [source.id, source.name]));

  return (
    <details className="group rounded-md border border-status-error-fg/20 bg-status-error-bg text-status-error-fg">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <WarningCircle size={18} weight="fill" aria-hidden="true" className="shrink-0" />
        <span className="min-w-0 flex-1">
          {errors.length === 1
            ? `${sourceNames.get(errors[0].sourceId) || "Satu sumber"} bermasalah`
            : `${errors.length} sumber bermasalah`}
          <span className="ml-1 font-normal">· hasil dari sumber lain tetap tersedia</span>
        </span>
        <span className="shrink-0 text-xs underline underline-offset-2 group-open:hidden">Detail</span>
        <span className="hidden shrink-0 text-xs underline underline-offset-2 group-open:inline">Tutup</span>
      </summary>
      <ul className="space-y-1 border-t border-status-error-fg/15 px-3 py-2 text-xs">
        {errors.map(({ sourceId, error }) => (
          <li key={sourceId}>
            <span className="font-semibold">{sourceNames.get(sourceId) || sourceId}</span>{" "}
            {getFriendlySourceError(error)}
          </li>
        ))}
      </ul>
    </details>
  );
}
