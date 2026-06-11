import { Plug } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { SourceMetadata } from "@/shared/types/source"

interface SourceCardProps {
  source: SourceMetadata
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 transition-all hover:bg-surface-overlay">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-surface-base border border-border-subtle">
          <Plug size={24} className="text-text-muted" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-[15px] font-bold text-text-primary">{source.name}</h3>
            <Badge variant={source.status === "online" ? "success" : "warning"}>
              <div className="size-1.5 rounded-full bg-current mr-1" />
              {source.status === "online" ? "Online" : "Offline"}
            </Badge>
          </div>
          <p className="truncate text-[13px] text-text-muted flex items-center gap-2 mt-0.5">
            <span className="uppercase">{source.language || "EN"}</span>
            <span>•</span>
            <span>v{source.version}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {Object.entries(source.capabilities).map(([key, value]) => {
          if (!value) return null;
          return (
            <Badge key={key} variant="muted">
              {key}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
