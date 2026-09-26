"use client"

import * as React from "react"
import { Toaster as Sonner } from "sonner"
import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="system"
    position="bottom-right"
    className="toaster group"
    closeButton
    richColors={false}
    gap={8}
    visibleToasts={4}
    icons={{
      success: <CheckCircle size={19} weight="fill" className="shrink-0 text-status-success-fg" />,
      error: <WarningCircle size={19} weight="fill" className="shrink-0 text-status-error-fg" />,
      warning: <Warning size={19} weight="fill" className="shrink-0 text-status-warning-fg" />,
      info: <Info size={19} weight="fill" className="shrink-0 text-status-info-fg" />,
    }}
    toastOptions={{
      duration: 4500,
      classNames: {
        toast: "!rounded-md !border !border-border-subtle !bg-surface-overlay !px-4 !py-3 !text-text-primary !shadow-md",
        content: "!gap-0.5",
        title: "!text-sm !font-bold !leading-snug !text-text-primary",
        description: "!text-xs !leading-relaxed !text-text-secondary",
        closeButton: "!border-border-subtle !bg-surface-raised !text-text-muted hover:!bg-surface-hover hover:!text-text-primary",
        actionButton: "!rounded-sm !bg-accent !px-3 !font-bold !text-accent-on",
        cancelButton: "!rounded-sm !bg-surface-muted !px-3 !font-semibold !text-text-secondary",
      },
    }}
    {...props}
  />
)

export { Toaster }
