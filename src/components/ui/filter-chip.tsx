import * as React from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "inverted" | "accent-subtle" | "accent-solid" | "error-solid" | "offline";
  label: string;
  showCheck?: boolean;
  showMinus?: boolean;
  showDownBadge?: boolean;
  selected?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ variant = "default", label, showCheck, showMinus, showDownBadge, selected, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        aria-pressed={selected}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 active:scale-[0.98]",
          variant === "inverted" && "bg-text-primary text-surface-base border-transparent",
          variant === "accent-subtle" && "bg-accent/10 border-accent text-accent",
          variant === "accent-solid" && "bg-accent text-white border-transparent shadow-[0_0_12px_rgba(94,92,230,0.3)]",
          variant === "error-solid" && "bg-semantic-error text-white border-transparent shadow-[0_0_12px_rgba(255,59,48,0.3)]",
          variant === "offline" && "bg-semantic-error/10 border-semantic-error/20 text-semantic-error hover:bg-semantic-error/20",
          variant === "default" && "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong",
          className
        )}
      >
        {showCheck && <Check size={14} weight="bold" />}
        {showMinus && <span className="mr-1 font-black">-</span>}
        {label}
        {showDownBadge && <span className="text-[10px] uppercase tracking-wider ml-1 bg-semantic-error text-white px-1.5 py-0.5 rounded-sm">Down</span>}
      </button>
    );
  }
);
FilterChip.displayName = "FilterChip";
