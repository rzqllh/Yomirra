"use client";

import { X } from "@phosphor-icons/react";

export interface AppliedFilter {
  key: string;
  label: string;
  remove: () => void;
}

export function AppliedFilters({ items = [], onReset }: { items?: AppliedFilter[]; onReset: () => void }) {
  if (!items.length) return null;
  return <div aria-label="Filter yang diterapkan" className="mb-4 flex flex-wrap items-center gap-2">
    {items.map((item) => <button type="button" key={item.key} onClick={item.remove}
      aria-label={`Hapus filter ${item.label}`} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-border-subtle px-3 text-xs text-text-secondary focus-visible:outline-2 focus-visible:outline-accent">
      <span className="break-words">{item.label}</span><X size={14} weight="regular" aria-hidden="true" />
    </button>)}
    <button type="button" onClick={onReset} className="min-h-11 px-2 text-xs font-semibold text-accent focus-visible:outline-2 focus-visible:outline-accent">Reset semua filter</button>
  </div>;
}
