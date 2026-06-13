import * as React from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"

interface PageImageErrorProps {
  index: number;
  onRetry: () => void;
  className?: string;
}

export function PageImageError({ index, onRetry, className }: PageImageErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center aspect-[3/4] w-full max-w-lg mx-auto bg-surface-raised border border-border-subtle rounded-lg p-8 text-center", className)}>
      <WarningCircle size={40} className="text-error mb-3" weight="duotone" />
      <h4 className="text-sm font-bold text-text-primary mb-1">Gagal memuat halaman {index}</h4>
      <p className="text-[11px] text-text-muted mb-4 max-w-[200px]">Gambar tidak dapat diunduh dari sumber.</p>
      
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  )
}
