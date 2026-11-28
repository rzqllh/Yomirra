"use client";
import type {QualitySort} from "@/shared/lib/source-quality";
export function SourceQualitySort({value,onChange}:{value:QualitySort;onChange:(value:QualitySort)=>void}){
  return <label className="flex items-center justify-between gap-2 text-xs text-text-secondary">
    <span>Urutkan sumber</span>
    <select aria-label="Urutkan sumber" value={value} onChange={event=>onChange(event.target.value as QualitySort)} className="min-h-9 rounded-md border border-border-subtle bg-surface-raised px-2 text-sm text-text-primary">
      <option value="quality">Kualitas</option>
      <option value="speed">Kecepatan</option>
      <option value="completeness">Kelengkapan chapter</option>
      <option value="freshness">Chapter terbaru</option>
    </select>
  </label>;
}
