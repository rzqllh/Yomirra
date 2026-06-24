"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-glass backdrop-blur-xl group-[.toaster]:text-text-primary group-[.toaster]:border-border-subtle group-[.toaster]:shadow-sm font-sans rounded-2xl",
          description: "group-[.toast]:text-text-secondary font-medium",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-text-on-accent font-bold px-4 py-1.5 rounded-full hover:bg-accent-hover transition-colors",
          cancelButton:
            "group-[.toast]:bg-surface-muted group-[.toast]:text-text-muted rounded-full",
          error: "group-[.toaster]:border-semantic-error/20 group-[.toaster]:bg-semantic-error/10 group-[.toaster]:text-semantic-error",
          success: "group-[.toaster]:border-semantic-success/20 group-[.toaster]:bg-semantic-success/10 group-[.toaster]:text-semantic-success",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
