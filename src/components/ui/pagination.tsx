import * as React from "react"
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, DotsThree } from "@phosphor-icons/react"
import { ButtonProps, buttonVariants } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      isActive && "bg-surface-raised border-border-strong text-text-primary",
      !isActive && "text-text-secondary hover:text-text-primary",
      "cursor-pointer",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <CaretLeft size={16} weight="bold" />
    <span className="sr-only sm:not-sr-only sm:text-xs">Sebelumnya</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span className="sr-only sm:not-sr-only sm:text-xs">Berikutnya</span>
    <CaretRight size={16} weight="bold" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationPrevious10 = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go backward 10 pages"
    size="icon"
    className={cn("", className)}
    {...props}
  >
    <CaretDoubleLeft size={16} weight="bold" />
  </PaginationLink>
)
PaginationPrevious10.displayName = "PaginationPrevious10"

const PaginationNext10 = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go forward 10 pages"
    size="icon"
    className={cn("", className)}
    {...props}
  >
    <CaretDoubleRight size={16} weight="bold" />
  </PaginationLink>
)
PaginationNext10.displayName = "PaginationNext10"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <DotsThree size={16} weight="bold" className="text-text-muted" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationNext10,
  PaginationPrevious10,
}
