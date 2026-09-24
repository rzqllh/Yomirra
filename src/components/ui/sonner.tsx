"use client"

import { Toaster as Sonner } from "sonner"
import { CheckCircle, WarningCircle, Info, Warning } from "@phosphor-icons/react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      className="toaster group"
      closeButton
      richColors={false}
      icons={{
        success: <CheckCircle size={20} weight="fill" className="text-status-success-fg shrink-0" />,
        error: <WarningCircle size={20} weight="fill" className="text-status-error-fg shrink-0" />,
        warning: <Warning size={20} weight="fill" className="text-status-warning-fg shrink-0" />,
        info: <Info size={20} weight="fill" className="text-status-info-fg shrink-0" />,
      }}
      style={{
        "--normal-bg": "var(--surface-overlay)",
        "--normal-text": "var(--text-primary)",
        "--normal-border": "var(--border-subtle)",
        "--border-radius": "12px",
      } as React.CSSProperties}
      toastOptions={{ duration: 5500 }}
      {...props}
    />
  )
}

export { Toaster }
