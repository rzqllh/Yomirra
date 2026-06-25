import { Plug, Warning, Lightning, Clock, Heartbeat, Bug, DotsThreeVertical, PencilSimple, ArrowsClockwise, Trash } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { SourceMetadata } from "@/shared/sources/source-types"
import { ReportDevSheet } from "./report-dev-sheet"
import { useState } from "react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry"
import { toast } from "sonner"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store"

interface SourceCardProps {
  source: SourceMetadata
}

export function SourceCard({ source, onUpdate }: SourceCardProps & { onUpdate?: () => void }) {
  const isDown = source.status !== "online" && source.status !== "slow";
  const [reportOpen, setReportOpen] = useState(false);
  const isCustom = !!source.manifestUrl;
  
  const { isSourceDisabled, toggleSource } = useSourcePreferencesStore();
  // The source is considered "enabled" locally if it is NOT in the disabledSources array
  // If the source is down, we automatically treat it as disabled unless overridden
  const isEnabled = !isSourceDisabled(source.id) && source.status !== "unavailable";

  const handleDelete = async () => {
    if (confirm(`Hapus sumber ${source.name}?`)) {
      await dynamicSourceRegistry.uninstall(source.id);
      toast.success("Sumber berhasil dihapus");
      onUpdate?.();
    }
  };

  const handleRefresh = async () => {
    try {
      toast.loading("Memperbarui sumber...", { id: `update-${source.id}` });
      await dynamicSourceRegistry.updateSource(source.id, { manifestUrl: source.manifestUrl });
      toast.success("Sumber berhasil diperbarui", { id: `update-${source.id}` });
      onUpdate?.();
    } catch (e) {
      toast.error("Gagal memperbarui sumber", { id: `update-${source.id}` });
    }
  };
  
  return (
    <div className="flex flex-col rounded-lg border border-border-subtle bg-surface-raised transition-all hover:bg-surface-overlay overflow-hidden">
      <div className="flex items-center gap-4 p-4 pb-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-base border border-border-subtle">
          {source.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={source.icon} 
              alt={`${source.name} icon`} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to plug icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Plug 
            size={24} 
            className={`text-text-muted ${source.icon ? 'hidden' : ''}`} 
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-base font-bold text-text-primary">{source.name}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {isCustom && (
                <Badge variant="outline" className="bg-surface-glass border-accent/20 text-accent font-semibold shadow-sm hidden md:flex">
                  Extension
                </Badge>
              )}
              {source.isNsfw && (
                <Badge variant="outline" className="bg-semantic-error/10 border-semantic-error/30 text-semantic-error font-semibold shadow-sm">
                  18+
                </Badge>
              )}
              <Badge variant={source.status === "online" ? "success" : source.status === "slow" ? "warning" : "error"}>
                <div className="size-1.5 rounded-full bg-current mr-1" />
                {source.status === "online" ? "Online" : source.status === "slow" ? "Lambat" : "Gangguan"}
              </Badge>
              <div className="flex items-center ml-2 border-l border-border-subtle pl-3">
                <ToggleSwitch 
                  checked={isEnabled}
                  onCheckedChange={() => toggleSource(source.id)}
                  title={isEnabled ? "Nonaktifkan Sumber" : "Aktifkan Sumber"}
                />
              </div>
              {isCustom && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <DotsThreeVertical size={20} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleRefresh}>
                      <ArrowsClockwise size={16} className="mr-2" /> Perbarui Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-semantic-error focus:bg-semantic-error/10 focus:text-semantic-error">
                      <Trash size={16} className="mr-2" /> Hapus Sumber
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <p className="truncate text-sm text-text-muted flex items-center gap-2 mt-0.5">
            <span className="uppercase">{source.language || "EN"}</span>
            <span>•</span>
            <span>v{source.version}</span>
          </p>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {Object.entries(source.capabilities).map(([key, value]) => {
          if (!value) return null;
          return (
            <Badge key={key} variant="muted">
              {key}
            </Badge>
          )
        })}
      </div>

      {source.healthStats && (
        <div className="bg-surface-base border-t border-border-subtle p-3 px-4">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Lightning size={14} className="text-accent" />
              <span className="font-semibold">{source.healthStats.uptime}</span> Uptime
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Heartbeat size={14} className="text-accent" />
              <span className="font-semibold">{source.healthStats.latency}</span> Ping
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted text-right justify-end">
              <Clock size={14} />
              <span>{source.healthStats.lastChecked}</span>
            </div>
          </div>
          {source.healthStats.message && (
            <p className="text-[11px] text-text-secondary mt-1 border-l-2 border-accent-dim pl-2">
              {source.healthStats.message}
            </p>
          )}
        </div>
      )}

      {isDown && (
        <div className="bg-semantic-error/10 border-t border-semantic-error/20 p-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-semantic-error text-sm font-semibold">
            <Warning size={16} weight="bold" />
            Sumber bermasalah
          </div>
          <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 text-xs font-bold bg-semantic-error text-semantic-error-on px-3 py-1.5 rounded-md hover:bg-semantic-error/90 transition-colors">
            <Bug size={14} weight="bold" /> Report Dev
          </button>
        </div>
      )}

      <ReportDevSheet
        source={source}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </div>
  )
}
