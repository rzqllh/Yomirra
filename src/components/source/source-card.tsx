"use client"

import * as React from "react"
import {
  ArrowsClockwise,
  Bug,
  CaretDown,
  CaretUp,
  Clock,
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
  if (status === "online") return { label: "Berfungsi", variant: "success" }
  if (status === "slow") return { label: "Lambat", variant: "warning" }
  if (status === "degraded") return { label: "Gangguan", variant: "warning" }
  if (status === "unknown") return { label: "Belum diperiksa", variant: "muted" }
  if (status === "in-dev") return { label: "Belum tersedia", variant: "muted" }
  return { label: "Tidak tersedia", variant: "error" }
}

function formatLastChecked(timestamp: number, fallback?: string): string {
  if (timestamp > 0) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp))
  }
  return fallback?.trim() || "Belum diperiksa"
}

function joinContexts(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  if (items.length === 2) return `${items[0]} dan ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, dan ${items.at(-1)}`
}

export function SourceCard({ source, onUpdate }: SourceCardProps) {
  const router = useRouter()
  const health = useSourceHealthStore((state) => state.getHealth(source.id))
  const { isSourceDisabled, toggleSource } = useSourcePreferencesStore()
  const [reportOpen, setReportOpen] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const effectiveStatus =
    health.status === "unknown" ? source.status || "unknown" : health.status
  const readerHealth = getReaderHealth(effectiveStatus)
  const isUnavailable = ["offline", "unavailable", "in-fix", "in-dev"].includes(
    effectiveStatus
  )
  const isPreferenceEnabled = !isSourceDisabled(source.id)
  const discoveryEligible = isDiscoverySourceSystemEligible(source)
  const searchEligible = isSearchSourceSystemEligible(source)
  const isCustom = Boolean(source.manifestUrl)

  const checkedAt = Math.max(health.lastSuccessAt || 0, health.lastErrorAt || 0)
  const lastChecked = formatLastChecked(checkedAt, source.healthStats?.lastChecked)

  const availableContexts = [
    ...(discoveryEligible ? ["Beranda", "Library", "Populer"] : []),
    ...(searchEligible ? ["pencarian"] : []),
  ]
  const availabilityCopy = isUnavailable
    ? "Untuk sementara sumber ini tidak dapat digunakan."
    : availableContexts.length > 0
      ? `Dapat digunakan di ${joinContexts(availableContexts)}.`
      : "Sumber ini belum tersedia untuk penjelajahan."

  const capabilityLabels = [
    source.capabilities.popular && "Populer",
    source.capabilities.latest && "Terbaru",
    source.capabilities.search && "Pencarian",
    source.capabilities.detail && "Detail komik",
    source.capabilities.chapters && "Daftar chapter",
    source.capabilities.pages && "Pembaca",
    source.capabilities.filters && "Filter",
  ].filter((value): value is string => Boolean(value))

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

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {availabilityCopy}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={14} aria-hidden="true" />
            Terakhir diperiksa {lastChecked}
          </p>

          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-bold text-text-muted transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
            aria-expanded={detailsOpen}
          >
            {detailsOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
            {detailsOpen ? "Sembunyikan detail" : "Lihat detail"}
          </button>
        </div>
      </div>

      {detailsOpen && (
        <div className="border-t border-border-subtle bg-surface-base/45 px-4 py-3 text-xs text-text-muted">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt className="font-semibold text-text-secondary">Bahasa</dt>
            <dd>{source.language?.toUpperCase() || "—"}</dd>
            {source.version && (
              <>
                <dt className="font-semibold text-text-secondary">Versi</dt>
                <dd>{source.version}</dd>
              </>
            )}
            <dt className="font-semibold text-text-secondary">Tersedia</dt>
            <dd>{capabilityLabels.join(", ") || "—"}</dd>
          </dl>

          {isUnavailable && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Bug size={14} aria-hidden="true" />
              Laporkan masalah
            </button>
          )}
        </div>
      )}

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
