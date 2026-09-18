"use client"

import { Toaster as Sonner } from "sonner"
import { CheckCircle, WarningCircle, Info, Warning } from "@phosphor-icons/react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group !mt-[env(safe-area-inset-top,0px)]"
      icons={{
        success: <CheckCircle size={15} weight="fill" className="text-emerald-400 shrink-0" />,
        error: <WarningCircle size={15} weight="fill" className="text-rose-400 shrink-0" />,
        warning: <Warning size={15} weight="fill" className="text-amber-400 shrink-0" />,
        info: <Info size={15} weight="fill" className="text-sky-400 shrink-0" />,
      }}
      style={{
        "--normal-bg": "rgba(0, 0, 0, 0.88)",
        "--normal-text": "#ffffff",
        "--normal-border": "rgba(255, 255, 255, 0.2)",
        "--border-radius": "9999px",
      } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "!bg-black/90 !backdrop-blur-2xl !text-white !border-white/20 !shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_16px_36px_-6px_rgba(0,0,0,0.85)] font-sans !rounded-full !px-4 !py-2.5",
          title: "!text-white !font-bold !text-xs",
          description: "!text-white/60 !font-medium !text-[11px]",
          actionButton:
            "!bg-white/15 hover:!bg-white/25 !text-white !border !border-white/20 !font-bold !px-3 !py-1 !rounded-full !text-xs transition-colors",
          cancelButton:
            "!bg-transparent !text-white/50 hover:!text-white !rounded-full !text-xs",
          error: "!border-rose-500/40 !text-white !shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_24px_rgba(244,63,94,0.25)]",
          success: "!border-emerald-500/40 !text-white !shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_24px_rgba(16,185,129,0.25)]",
          info: "!border-sky-500/40 !text-white !shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_24px_rgba(56,189,248,0.25)]",
          warning: "!border-amber-500/40 !text-white !shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_24px_rgba(245,158,11,0.25)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
