"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      className="toaster group !mt-[env(safe-area-inset-top,0px)]"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/90 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-white group-[.toaster]:border-white/20 group-[.toaster]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_16px_36px_-6px_rgba(0,0,0,0.85)] font-sans rounded-full px-4 py-2.5",
          description: "group-[.toast]:text-white/60 font-medium text-xs",
          actionButton:
            "group-[.toast]:bg-white/15 group-[.toast]:hover:bg-white/25 group-[.toast]:text-white group-[.toast]:border group-[.toast]:border-white/20 font-bold px-3 py-1 rounded-full text-xs transition-colors",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-white/50 group-[.toast]:hover:text-white rounded-full text-xs",
          error: "group-[.toaster]:border-semantic-error/40 group-[.toaster]:text-white group-[.toaster]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_24px_rgba(239,68,68,0.2)]",
          success: "group-[.toaster]:border-semantic-success/40 group-[.toaster]:text-white group-[.toaster]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_24px_rgba(16,185,129,0.2)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
