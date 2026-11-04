"use client"

import * as React from "react"
import { ToggleSwitch } from "@/components/ui/toggle-switch"

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  (props, ref) => {
    return <ToggleSwitch ref={ref} {...props} />
  }
)

Toggle.displayName = "Toggle"
export { ToggleSwitch }
