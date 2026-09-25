"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-surface-base text-text-primary",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

type CommandDialogProps = React.ComponentPropsWithoutRef<typeof Dialog> & 
  Pick<React.ComponentPropsWithoutRef<typeof CommandPrimitive>, "shouldFilter" | "filter">

const CommandDialog = ({ children, shouldFilter, filter, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="ink-dialog-content fixed left-1/2 top-1/2 z-[var(--z-overlay)] -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-xl sm:max-w-2xl max-h-[85vh] rounded-[20px] border border-border-subtle bg-surface-base text-text-primary shadow-2xl p-0 overflow-hidden outline-none flex flex-col"
        >
          <DialogTitle className="sr-only">Menu Pencarian</DialogTitle>
          <Command
            shouldFilter={shouldFilter}
            filter={filter}
            className="flex flex-col h-full w-full overflow-hidden [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
          >
            {children}
          </Command>
          <DialogPrimitive.Close
            className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-[8px] bg-surface-muted text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer z-20"
            aria-label="Tutup"
          >
            <X size={14} weight="bold" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="relative flex items-center border-b border-border-subtle px-4 h-14 bg-surface-base shrink-0" cmdk-input-wrapper="">
    <MagnifyingGlass className="mr-3 h-5 w-5 shrink-0 text-text-muted" weight="bold" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-full w-full bg-transparent pr-12 text-sm sm:text-base font-semibold outline-none placeholder:text-text-muted placeholder:font-normal text-text-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-text-muted"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-text-primary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border-default", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-[12px] px-3 py-2.5 text-sm outline-none transition-colors aria-selected:bg-accent-dim aria-selected:text-accent hover:bg-surface-hover active:scale-[0.99]",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
}
