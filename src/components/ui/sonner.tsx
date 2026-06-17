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
            "group-[.toast]:bg-accent group-[.toast]:text-surface-base font-bold px-4 py-1.5 rounded-md hover:bg-accent-hover transition-colors",
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
