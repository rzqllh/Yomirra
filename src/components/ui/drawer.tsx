import * as React from "react"
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/shared/utils/cn"

const Drawer = Sheet
const DrawerTrigger = SheetTrigger
const DrawerClose = SheetClose

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  React.ComponentPropsWithoutRef<typeof SheetContent>
>(({ className, children, ...props }, ref) => (
  <SheetContent
    side="bottom"
    className={cn("rounded-t-2xl pb-10", className)}
    ref={ref}
    {...props}
  >
    <div className="mx-auto mt-[-10px] mb-4 h-1.5 w-12 rounded-full bg-border-strong" />
    {children}
  </SheetContent>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = SheetHeader
const DrawerFooter = SheetFooter
const DrawerTitle = SheetTitle
const DrawerDescription = SheetDescription

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
