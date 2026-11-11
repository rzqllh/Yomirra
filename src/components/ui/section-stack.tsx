import * as React from "react"
import { cn } from "@/shared/utils/cn"

export type SectionStackLevel = "page" | "section" | "card" | "row" | "control"

const levelGapMap: Record<SectionStackLevel, string> = {
  page: "gap-6",
  section: "gap-4 sm:gap-5",
  card: "gap-3",
  row: "gap-2",
  control: "gap-1.5",
}

export interface SectionStackProps extends React.HTMLAttributes<HTMLElement> {
  level?: SectionStackLevel
  as?: React.ElementType
}

export const SectionStack = React.forwardRef<HTMLElement, SectionStackProps>(
  ({ className, level = "section", as: Component = "div", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        data-stack-level={level}
        className={cn("flex flex-col", levelGapMap[level], className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
SectionStack.displayName = "SectionStack"
