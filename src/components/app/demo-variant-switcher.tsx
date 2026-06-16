"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PaintBrush } from "@phosphor-icons/react";
import * as React from "react";
import { cn } from "@/shared/utils/cn";

const VARIANTS = ['A', 'B', 'C', 'D', 'E'];

export function DemoVariantSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentVariant = searchParams.get("feedVariant") || "A";

  const setVariant = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("feedVariant", v);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-surface-glass backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[180px] animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1 px-1">Discovery Variant</div>
          {VARIANTS.map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all text-left",
                currentVariant === v 
                  ? "bg-accent text-white shadow-md" 
                  : "hover:bg-white/10 text-text-primary"
              )}
            >
              Variant {v}
              {v === 'A' && " (Stacked)"}
              {v === 'B' && " (Split)"}
              {v === 'C' && " (Magazine)"}
              {v === 'D' && " (Masonry)"}
              {v === 'E' && " (Tinder Swipe)"}
            </button>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-transform hover:scale-105 active:scale-95"
      >
        <PaintBrush size={24} weight="duotone" />
      </button>
    </div>
  );
}
