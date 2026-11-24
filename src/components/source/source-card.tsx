"use client"

import * as React from "react"
import {
  ArrowsClockwise,
  Bug,
  DotsThreeVertical,
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
import { useRouter } from "next/navigation"
import {
  isDiscoverySourceSystemEligible,
} from "@/shared/sources/discovery-source-policy"
import { cn } from "@/shared/utils/cn"
import { DEFAULT_DISABLED_SOURCE_IDS } from "@/shared/sources/source-defaults"

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
  if (status === "degraded") return { label: "Pemeriksaan tidak stabil", variant: "warning" }
  if (status === "in-fix") return { label: "Dalam perbaikan", variant: "warning" }
  if (status === "in-dev") return { label: "Dalam pengembangan", variant: "muted" }
  if (status === "disabled") return { label: "Nonaktif oleh pengelola", variant: "warning" }
  if (status === "unknown") return { label: "Belum diperiksa", variant: "muted" }
  return { label: "Pemeriksaan belum berhasil", variant: "warning" }
}

export function SourceCard({ source, onUpdate }: SourceCardProps) {
  const router = useRouter()
  const { isSourceDisabled, toggleSource } = useSourcePreferencesStore()
  const [reportOpen, setReportOpen] = React.useState(false)
  const [failedIconUrl, setFailedIconUrl] = React.useState<string | undefined>()

  // Trust functional server health, not old browser-local request failures.
  const effectiveStatus = !source.isEnabled
    ? "disabled"
    : source.maintenance ? "in-fix" : source.status || "unknown"
  const readerHealth = getReaderHealth(effectiveStatus)
  const isUnavailable = Boolean(source.maintenance) || !source.isEnabled || ["in-fix", "in-dev"].includes(effectiveStatus)
  const hasHealthAlert = !isUnavailable && ["slow", "degraded", "offline", "unavailable"].includes(effectiveStatus)
  const initials = source.name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "?"
  // Keep the fallback visible until the real icon has decoded. A new URL
  // receives a new load attempt; stale load/error events cannot affect it.
  const [loadedIconUrl, setLoadedIconUrl] = React.useState<string | undefined>()
  const showIcon = Boolean(source.icon) && source.icon !== failedIconUrl
  const iconReady = showIcon && loadedIconUrl === source.icon
  const coverage = effectiveStatus === "online" ? source.healthStats?.coverage : undefined
  const coverageLabel = coverage === "page-references" ? "Referensi halaman tersedia; gambar belum diuji" :
    coverage === "chapters" ? "Daftar chapter teruji; halaman belum diuji" :
    coverage === "catalog" ? "Katalog teruji; reader belum diuji" :
    coverage === "transport" ? "Koneksi teruji; fungsi baca belum diuji" :
    effectiveStatus === "online" ? "Cakupan pemeriksaan belum diketahui" : undefined
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
        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-surface-base" aria-hidden="true">
          {!iconReady && <span className="flex size-full items-center justify-center bg-accent/10 text-base font-black tracking-tight text-accent">{initials}</span>}
          {showIcon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={source.icon}
              src={source.icon}
              alt=""
              className={cn("absolute inset-0 size-full object-contain p-1", !iconReady && "opacity-0")}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onLoad={() => setLoadedIconUrl(source.icon)}
              onError={() => setFailedIconUrl(source.icon)}
            />
          )}
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
                    <DotsThreeVertical size={18} weight="regular" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-md">
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

          {source.healthStats && (source.healthStats.latency !== "-" || source.healthStats.uptime !== "-") ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs text-text-muted">
              {source.healthStats.latency !== "-" && (
                <span>Latensi: {source.healthStats.latency}</span>
              )}
              {source.healthStats.uptime !== "-" && (
                <span>Probe (24 jam): {source.healthStats.uptime}</span>
              )}
            </div>
          ) : null}

          {coverageLabel && <p className="mt-2 text-xs leading-relaxed text-text-secondary">{coverageLabel}</p>}

          {isUnavailable || hasHealthAlert ? (
            <div role="status" className="mt-2.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn(
                  "text-xs font-medium",
                  isUnavailable || ["offline", "unavailable"].includes(effectiveStatus)
                    ? "text-semantic-error" : "text-text-secondary"
                )}>
                  {source.maintenance?.reason || source.healthStats?.message || (isUnavailable
                    ? "Sumber sedang dibatasi pengelola."
                    : "Pemeriksaan gagal, tetapi sumber mungkin masih bisa dibaca.")}
                </p>
                {source.healthStats?.lastChecked && source.healthStats.lastChecked !== "Belum diperiksa" && (
                  <p className="mt-1 text-2xs text-text-muted">Diperiksa: {source.healthStats.lastChecked}</p>
                )}
              </div>
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
            checked={isPreferenceEnabled && source.isEnabled && !source.maintenance}
            disabled={!source.isEnabled || Boolean(source.maintenance)}
            onCheckedChange={() => {
              toggleSource(source.id)
              window.dispatchEvent(new Event("sources_updated"))
              router.refresh()
            }}
            label={isPreferenceEnabled ? "Nonaktifkan untuk penjelajahan" : "Aktifkan untuk penjelajahan"}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-primary">
              {source.maintenance ? "Dijeda" : !source.isEnabled ? "Dinonaktifkan pengelola" : isPreferenceEnabled ? "Aktif" : "Nonaktif"}
            </p>
            <p className="truncate text-2xs text-text-muted">
              {!isPreferenceEnabled && DEFAULT_DISABLED_SOURCE_IDS.some(id => id === source.id)
                ? "Belum lulus uji baca lengkap"
                : "Pengaturan sumber untuk Jelajah"}
            </p>
          </div>
        </div>

        {discoveryEligible && isPreferenceEnabled && !isUnavailable && (
          <button
            type="button"
            onClick={() =>
              router.push(`/library?source=${encodeURIComponent(source.id)}`)
            }
            className="inline-flex min-h-11 shrink-0 items-center rounded-sm bg-accent px-3 text-xs font-bold text-accent-on transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Buka Jelajah
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
