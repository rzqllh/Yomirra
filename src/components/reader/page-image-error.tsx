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
    <div className={cn("flex flex-col items-center justify-center min-h-[200px] w-full max-w-[400px] mx-auto bg-surface-muted/30 border border-border-subtle/50 rounded-xl p-6 text-center", className)}>
      <WarningCircle size={32} className="text-text-muted mb-2" weight="duotone" />
      <h4 className="text-xs font-bold text-text-primary mb-1">Halaman {index} gagal dimuat</h4>
      <p className="text-[10px] text-text-muted mb-4">Gambar tidak dapat diunduh</p>
      
      <Button variant="outline" size="sm" onClick={onRetry} className="rounded-full h-8 px-4 text-xs font-bold shadow-sm">
        Coba Lagi
      </Button>
    </div>
  )
}
