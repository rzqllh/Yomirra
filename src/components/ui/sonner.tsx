"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group md:!bottom-4 md:!right-4 md:!top-auto md:!left-auto"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-overlay group-[.toaster]:text-text-primary group-[.toaster]:border-border-default group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-surface-raised group-[.toast]:text-text-primary",
          cancelButton:
            "group-[.toast]:bg-surface-base group-[.toast]:text-text-muted",
          error: "group-[.toaster]:border-semantic-error/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
