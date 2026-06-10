import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/shared/utils/cn"

type IconButtonVariant = "ghost" | "surface" | "primary" | "destructive" | "reader"

const variantMap: Record<IconButtonVariant, ButtonProps["variant"]> = {
  ghost: "ghost",
  surface: "secondary",
  primary: "default",
  destructive: "destructive",
  reader: "reader",
}

interface IconButtonProps extends Omit<ButtonProps, "variant" | "size" | "asChild"> {
  /** Required accessible label for screen readers */
  "aria-label": string
  variant?: IconButtonVariant
  size?: "sm" | "default" | "lg"
}

const sizeMap: Record<"sm" | "default" | "lg", ButtonProps["size"]> = {
  sm: "icon-sm",
  default: "icon",
  lg: "icon-lg",
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "default", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        className={cn("rounded-full", className)}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
export type { IconButtonProps }
