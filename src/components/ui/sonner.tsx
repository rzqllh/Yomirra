"use client"

import * as React from "react"
import { Toaster as Sonner, toast, type ExternalToast } from "sonner"
import { Check, Info, Warning, X, CircleNotch } from "@phosphor-icons/react"

type ToasterProps = React.ComponentProps<typeof Sonner>
type ToastPosition = "top-right" | "top-center"

/**
 * Responsive toast position:
 * - Desktop (>= 1024px): top-right
 * - Tablet (768px - 1023px): top-right in landscape, top-center in portrait
 * - Mobile (< 768px): always top-center
 */
function useResponsiveToastPosition(): ToastPosition {
  const [position, setPosition] = React.useState<ToastPosition>(() => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth
      const isLandscape = typeof window.matchMedia === "function"
        ? window.matchMedia("(orientation: landscape)").matches
        : false
      if (width >= 1024) return "top-right"
      if (width >= 768) return isLandscape ? "top-right" : "top-center"
      return "top-center"
    }
    return "top-center"
  })

  React.useEffect(() => {
    const computePosition = (): ToastPosition => {
      const width = window.innerWidth
      const isLandscape = typeof window.matchMedia === "function"
        ? window.matchMedia("(orientation: landscape)").matches
        : false

      if (width >= 1024) return "top-right"
      if (width >= 768) return isLandscape ? "top-right" : "top-center"
      return "top-center"
    }

    const handleUpdate = () => {
      setPosition(computePosition())
    }

    handleUpdate()

    window.addEventListener("resize", handleUpdate)

    let cleanupOrientation: (() => void) | undefined
    if (typeof window.matchMedia === "function") {
      const orientationQuery = window.matchMedia("(orientation: landscape)")
      if (orientationQuery.addEventListener) {
        orientationQuery.addEventListener("change", handleUpdate)
        cleanupOrientation = () => orientationQuery.removeEventListener("change", handleUpdate)
      } else if (orientationQuery.addListener) {
        orientationQuery.addListener(handleUpdate)
        cleanupOrientation = () => orientationQuery.removeListener(handleUpdate)
      }
    }

    return () => {
      window.removeEventListener("resize", handleUpdate)
      cleanupOrientation?.()
    }
  }, [])

  return position
}

const Toaster = ({ position: propPosition, ...props }: ToasterProps) => {
  const autoPosition = useResponsiveToastPosition()
  const resolvedPosition = propPosition ?? autoPosition

  return (
    <Sonner
      theme="system"
      position={resolvedPosition}
      className="toaster group"
      closeButton
      richColors={false}
      gap={12}
      visibleToasts={4}
      icons={{
        success: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/25">
            <Check size={16} weight="bold" />
          </div>
        ),
        error: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/25">
            <X size={16} weight="bold" />
          </div>
        ),
        warning: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/25">
            <Warning size={16} weight="bold" />
          </div>
        ),
        info: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-2 ring-blue-500/25">
            <Info size={16} weight="bold" />
          </div>
        ),
        loading: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm ring-2 ring-indigo-500/25">
            <CircleNotch size={16} weight="bold" className="motion-safe:animate-spin" />
          </div>
        ),
      }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "yomirra-toast",
          title: "yomirra-toast-title",
          description: "yomirra-toast-description",
          actionButton: "yomirra-toast-action",
          cancelButton: "yomirra-toast-cancel",
          closeButton: "yomirra-toast-close",
        },
      }}
      {...props}
    />
  )
}

export type YomirraToastOptions = ExternalToast

export const yToast = {
  success: (title: React.ReactNode, options?: YomirraToastOptions) => toast.success(title, options),
  info: (title: React.ReactNode, options?: YomirraToastOptions) => toast.info(title, options),
  warning: (title: React.ReactNode, options?: YomirraToastOptions) => toast.warning(title, options),
  error: (title: React.ReactNode, options?: YomirraToastOptions) => toast.error(title, options),
  loading: (title: React.ReactNode, options?: YomirraToastOptions) => toast.loading(title, options),
  dismiss: (id?: string | number) => toast.dismiss(id),
  promise: toast.promise,
  custom: toast.custom,
}

export { Toaster, toast, useResponsiveToastPosition }
