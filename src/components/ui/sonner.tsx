"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-overlay group-[.toaster]:text-text-primary group-[.toaster]:border-border-subtle group-[.toaster]:shadow-floating",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-surface-raised group-[.toast]:text-text-primary",
          cancelButton:
            "group-[.toast]:bg-surface-base group-[.toast]:text-text-muted",
          error: "group-[.toaster]:border-error-muted",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
