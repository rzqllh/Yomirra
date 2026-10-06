"use client"

import * as React from "react"
import {
  ArrowsClockwise,
  Bug,
  DotsThreeVertical,
  Plug,
  Trash,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { SourceMetadata } from "@/shared/sources/source-types"
import { ReportDevSheet } from "./report-dev-sheet"
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
import { useSourceHealthStore } from "@/shared/store/source-health-store"
import { useRouter } from "next/navigation"
import {
  isDiscoverySourceSystemEligible,
  isSearchSourceSystemEligible,
} from "@/shared/sources/discovery-source-policy"
import { cn } from "@/shared/utils/cn"

interface SourceCardProps {
  source: SourceMetadata
  onUpdate?: () => void
}

type ReaderHealth = {
  label: string
  variant: "success" | "warning" | "error" | "muted"
}

function getReaderHealth(status: string): ReaderHealth {
  if (status === "online") return { label: "Normal", variant: "success" }
  if (status === "slow") return { label: "Lambat", variant: "warning" }
  if (status === "degraded") return { label: "Gangguan", variant: "warning" }
  if (status === "unknown") return { label: "Normal", variant: "success" }
  return { label: "Tidak dapat digunakan", variant: "error" }
}

export function SourceCard({ source, onUpdate }: SourceCardProps) {
  const router = useRouter()
  const health = useSourceHealthStore((state) => state.getHealth(source.id))
  const { isSourceDisabled, toggleSource } = useSourcePreferencesStore()
  const [reportOpen, setReportOpen] = React.useState(false)

  const effectiveStatus =
    health.status === "unknown" ? source.status || "unknown" : health.status
  const readerHealth = getReaderHealth(effectiveStatus)
  const isUnavailable = ["offline", "unavailable", "in-fix", "in-dev"].includes(
    effectiveStatus
  )
  const isPreferenceEnabled = !isSourceDisabled(source.id)
  const discoveryEligible = isDiscoverySourceSystemEligible(source)
  const isCustom = Boolean(source.manifestUrl)

  const handleDelete = async () => {
    if (!confirm(`Hapus sumber ${source.name}?`)) return
    await dynamicSourceRegistry.uninstall(source.id)
    toast.info("Sumber dihapus", {
      description: `${source.name} dihapus dari perangkat ini.`,
    })
    onUpdate?.()
  }

  const handleRefresh = async () => {
    try {
      toast.loading("Memperbarui sumber", {
        id: `update-${source.id}`,
        description: `Memeriksa pembaruan untuk ${source.name}…`,
      })
      await dynamicSourceRegistry.updateSource(source.id, {
        manifestUrl: source.manifestUrl,
      })
      toast.success("Sumber diperbarui", {
        id: `update-${source.id}`,
        description: `${source.name} sudah memakai versi terbaru.`,
      })
      onUpdate?.()
    } catch {
      toast.error("Pembaruan gagal", {
        id: `update-${source.id}`,
        description: "Coba lagi beberapa saat.",
      })
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
      <div className="flex items-start gap-3.5 p-4">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-surface-base">
          {source.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source.icon}
              alt=""
              aria-hidden="true"
              className="size-full object-cover"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = "none"
                event.currentTarget.nextElementSibling?.classList.remove("hidden")
              }}
            />
          ) : null}
          <Plug
            size={24}
            className={cn("text-text-muted", source.icon && "hidden")}
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-text-primary">
                {source.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={readerHealth.variant}>{readerHealth.label}</Badge>
                {source.language && (
                  <Badge variant="muted">{source.language.toUpperCase()}</Badge>
                )}
                {source.isNsfw && (
                  <Badge variant="error" aria-label="Sumber khusus 18 tahun ke atas">
                    18+
                  </Badge>
                )}
              </div>
            </div>

            {isCustom && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
                    aria-label={`Kelola ${source.name}`}
                  >
                    <DotsThreeVertical size={18} weight="bold" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem onClick={handleRefresh}>
                    <ArrowsClockwise size={16} className="mr-2" />
                    Perbarui
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-semantic-error focus:bg-semantic-error/10 focus:text-semantic-error"
                  >
                    <Trash size={16} className="mr-2" />
                    Hapus sumber
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isUnavailable ? (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-semantic-error">
                Sumber tidak dapat digunakan saat ini.
              </p>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors shrink-0"
              >
                <Bug size={13} aria-hidden="true" />
                <span>Laporkan</span>
              </button>
            </div>
          ) : source.description ? (
            <p className="mt-2.5 text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {source.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-base/35 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <ToggleSwitch
            checked={isPreferenceEnabled}
            onCheckedChange={() => {
              toggleSource(source.id)
              window.dispatchEvent(new Event("sources_updated"))
              router.refresh()
            }}
            label={isPreferenceEnabled ? "Nonaktifkan untuk penjelajahan" : "Aktifkan untuk penjelajahan"}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-primary">
              {isPreferenceEnabled ? "Aktif" : "Nonaktif"}
            </p>
            <p className="truncate text-[11px] text-text-muted">
              Preferensi penjelajahan
            </p>
          </div>
        </div>

        {discoveryEligible && isPreferenceEnabled && !isUnavailable && (
          <button
            type="button"
            onClick={() =>
              router.push(`/library?source=${encodeURIComponent(source.id)}`)
            }
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-accent px-3 text-xs font-bold text-accent-on transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Buka Library
          </button>
        )}
      </div>

      <ReportDevSheet
        source={source}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </article>
  )
}
