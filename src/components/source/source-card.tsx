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
import { useRouter } from "next/navigation"

interface SourceCardProps {
  source: SourceMetadata
}

export function SourceCard({ source, onUpdate }: SourceCardProps & { onUpdate?: () => void }) {
  const isDown = source.status !== "online" && source.status !== "slow";
  const [reportOpen, setReportOpen] = useState(false);
  const isCustom = !!source.manifestUrl;
  const router = useRouter();
  
  const { isSourceDisabled, toggleSource } = useSourcePreferencesStore();
  // The source is considered "enabled" locally if it is NOT in the disabledSources array
  const isEnabled = !isSourceDisabled(source.id);

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
    <div className="flex flex-col rounded-2xl border border-border-subtle bg-surface-raised transition-all hover:border-border-strong hover:bg-surface-overlay overflow-hidden shadow-xs">
      <div className="flex items-start gap-3.5 p-4 pb-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-base border border-border-subtle shadow-inner">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-bold text-text-primary tracking-tight">{source.name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {isCustom && (
                <Badge variant="outline" className="bg-surface-glass border-accent/20 text-accent font-semibold shadow-xs hidden sm:flex rounded-lg">
                  Extension
                </Badge>
              )}
              {source.isNsfw && (
                <Badge variant="outline" className="bg-semantic-error/10 border-semantic-error/30 text-semantic-error font-semibold shadow-xs rounded-lg">
                  18+
                </Badge>
              )}
              <Badge variant={source.status === "online" ? "success" : source.status === "slow" ? "warning" : "error"} className="rounded-lg">
                <span className="size-1.5 rounded-full bg-current mr-1" />
                {source.status === "online" ? "Online" : source.status === "slow" ? "Lambat" : "Gangguan"}
              </Badge>
              {isCustom && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <DotsThreeVertical size={18} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
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
          <div className="flex items-center justify-between mt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="uppercase font-semibold tracking-wider">{source.language || "ID"}</span>
              <span>•</span>
              <span>v{source.version}</span>
            </span>
            <span className="text-[11px] font-medium text-text-muted">
              {isEnabled ? "Sumber Aktif" : "Dinonaktifkan"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {Object.entries(source.capabilities).map(([key, value]) => {
          if (!value) return null;
          return (
            <Badge key={key} variant="muted" className="rounded-md text-[10px] uppercase font-semibold">
              {key}
            </Badge>
          );
        })}
      </div>

      {source.healthStats && (
        <div className="bg-surface-base/80 border-t border-border-subtle p-3 px-4">
          <div className="grid grid-cols-3 gap-2 mb-1 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Lightning size={14} className="text-accent shrink-0" />
              <span className="font-semibold text-text-secondary">{source.healthStats.uptime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heartbeat size={14} className="text-accent shrink-0" />
              <span className="font-semibold text-text-secondary">{source.healthStats.latency}</span>
            </div>
            <div className="flex items-center gap-1.5 text-right justify-end text-[11px]">
              <Clock size={13} className="shrink-0" />
              <span className="truncate">{source.healthStats.lastChecked}</span>
            </div>
          </div>
          {source.healthStats.message && (
            <p className="text-[11px] text-text-muted mt-1 border-l-2 border-accent/40 pl-2 line-clamp-1">
              {source.healthStats.message}
            </p>
          )}
        </div>
      )}

      {/* Action Footer: Enabled toggle & Direct Library Browse link */}
      <div className="border-t border-border-subtle bg-surface-base/40 p-3 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ToggleSwitch 
            checked={isEnabled}
            onCheckedChange={() => {
              toggleSource(source.id);
              window.dispatchEvent(new Event("sources_updated"));
              router.refresh();
            }}
            title={isEnabled ? "Nonaktifkan Sumber" : "Aktifkan Sumber"}
          />
          <span className="text-xs font-semibold text-text-secondary">
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {isEnabled && (
          <button
            type="button"
            onClick={() => router.push(`/library?source=${encodeURIComponent(source.id)}`)}
            className="text-xs font-bold text-accent hover:text-accent-hover px-2.5 py-1 rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-1"
          >
            <span>Buka di Library</span>
            <span className="text-[11px]">&rarr;</span>
          </button>
        )}
      </div>

      {isDown && (
        <div className="bg-semantic-error/10 border-t border-semantic-error/20 p-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-semantic-error text-sm font-semibold">
            <Warning size={16} weight="bold" />
            Sumber bermasalah
          </div>
          <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 text-xs font-bold bg-semantic-error text-semantic-error-on px-3 py-1.5 rounded-lg hover:bg-semantic-error/90 transition-colors">
            <Bug size={14} weight="bold" /> Laporkan
          </button>
        </div>
      )}

      <ReportDevSheet
        source={source}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </div>
  );
}
