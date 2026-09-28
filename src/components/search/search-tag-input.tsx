"use client";

import * as React from "react";
import { X } from "@phosphor-icons/react";
import { SearchInput } from "@/components/ui/search-input";
import {
  parseSearchExpression,
  suggestSearchTags,
  type SearchTagCategory,
} from "@/shared/lib/search-intelligence";
import type { MergedFilterList } from "@/shared/utils/filter-helpers";

interface SearchTagInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClear: () => void;
  filters: MergedFilterList;
}

const CATEGORY_LABELS: Record<SearchTagCategory, string> = {
  genre: "Genre",
  format: "Format",
  status: "Status",
};

export function SearchTagInput({
  value,
  onChange,
  onSubmit,
  onClear,
  filters,
}: SearchTagInputProps) {
  const parsed = React.useMemo(
    () => parseSearchExpression(value, filters),
    [value, filters]
  );
  const fragment = React.useMemo(() => {
    const match = value.match(/(?:^|\s)#([^\s#]*)$/u);
    return match?.[1] ?? null;
  }, [value]);
  const suggestions = React.useMemo(
    () => (fragment === null ? [] : suggestSearchTags(fragment, filters, 6)),
    [fragment, filters]
  );

  const chooseSuggestion = (tagId: string) => {
    const hashIndex = value.lastIndexOf("#");
    if (hashIndex < 0) return;
    const next = `${value.slice(0, hashIndex)}#${tagId} `;
    onChange(next.replace(/\s{2,}/g, " "));
  };

  const removeTag = (raw: string) => {
    onChange(
      value
        .replace(raw, " ")
        .replace(/\s{2,}/g, " ")
        .trimStart()
    );
  };

  return (
    <div className="relative flex-1 min-w-0">
      <SearchInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSubmitAction={onSubmit}
        placeholder="Cari judul, kreator, atau #tag…"
        containerClassName="min-h-11"
        onClear={onClear}
        autoComplete="off"
        aria-label="Cari komik"
      />

      {parsed.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Tag pencarian aktif">
          {parsed.tags.map((tag) => (
            <button
              key={`${tag.category}:${tag.id}`}
              type="button"
              onClick={() => removeTag(tag.raw)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/20 bg-accent-dim px-2.5 text-[11px] font-semibold text-accent transition-colors hover:border-accent/35 hover:bg-accent/10"
              aria-label={`Hapus tag ${tag.label}`}
            >
              <span>{tag.label}</span>
              <X size={11} weight="bold" />
            </button>
          ))}
        </div>
      )}

      {fragment !== null && (
        <div className="absolute left-0 right-0 top-[48px] z-50 overflow-hidden rounded-md border border-border-subtle bg-surface-overlay shadow-lg">
          {suggestions.length > 0 ? (
            <div className="p-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.category}:${suggestion.id}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseSuggestion(suggestion.id)}
                  className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                >
                  <span className="text-sm font-semibold text-text-primary">
                    #{suggestion.id}
                  </span>
                  <span className="text-[11px] font-medium text-text-muted">
                    {CATEGORY_LABELS[suggestion.category]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2.5 text-xs text-text-muted">
              Tag belum dikenali.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
