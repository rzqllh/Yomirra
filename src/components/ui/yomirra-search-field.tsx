"use client"

import * as React from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

export interface YomirraSearchFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmitAction?: (e: React.FormEvent, value: string) => void;
  containerClassName?: string;
}

export const YomirraSearchField = React.forwardRef<HTMLInputElement, YomirraSearchFieldProps>(
  ({ className, containerClassName, onSubmitAction, value, onChange, ...props }, ref) => {
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmitAction) {
        onSubmitAction(e, value?.toString() || "");
      }
    };

    return (
      <form 
        onSubmit={handleSubmit} 
        className={cn(
          "group flex items-center gap-2.5 rounded-full bg-surface-muted px-4 transition-all duration-300 ease-out h-[44px]",
          "hover:bg-surface-hover focus-within:bg-surface-overlay focus-within:shadow-sm",
          "border border-transparent focus-within:border-border-default focus-within:ring-2 focus-within:ring-accent/20",
          containerClassName
        )}
      >
        <MagnifyingGlass 
          className="size-[20px] text-text-muted shrink-0 transition-colors group-focus-within:text-accent" 
          weight="regular" 
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            "flex-1 bg-transparent text-[15px] font-medium text-text-primary outline-none placeholder:text-text-muted/60 w-full min-w-0 h-full",
            className
          )}
          {...props}
        />
      </form>
    )
  }
)

YomirraSearchField.displayName = "YomirraSearchField"
