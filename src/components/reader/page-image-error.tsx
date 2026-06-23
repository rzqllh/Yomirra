import * as React from "react"
import { WarningCircle, Flag } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"

interface PageImageErrorProps {
  index: number;
  onRetry: () => void;
  className?: string;
}

export function PageImageError({ index, onRetry, className }: PageImageErrorProps) {
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-black/40 backdrop-blur-md p-6 text-center z-10", className)}>
      <div className="bg-surface-overlay/80 backdrop-blur-xl rounded-2xl p-6 -2xl flex flex-col items-center max-w-[280px]">
        <WarningCircle size={40} className="text-red-400 mb-3 drop-shadow-md" weight="duotone" />
        <h4 className="text-sm font-bold text-white mb-1 drop-shadow-sm">Gambar {index} Rusak</h4>
        <p className="text-[10px] text-white/70 mb-5 leading-tight">Terjadi kesalahan saat mengunduh gambar ini. Coba muat ulang halaman atau lapor.</p>
        
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onRetry} className="flex-1 rounded-full h-10 text-xs font-bold border-white/20 bg-white/5 hover:bg-white/10 text-white shadow-sm">
            Coba Lagi
          </Button>
          <Button aria-label="Laporkan masalah" variant="ghost" size="sm" className="rounded-full size-10 p-0 shrink-0 border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white shadow-sm">
            <Flag size={16} weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  )
}
