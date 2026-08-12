import * as React from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "inverted" | "accent-subtle" | "accent-solid" | "error-solid" | "offline";
  label: React.ReactNode;
  showCheck?: boolean;
  showMinus?: boolean;
  showDownBadge?: boolean;
  selected?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ variant = "default", label, showCheck, showMinus, showDownBadge, selected, className, "aria-label": ariaLabel, ...props }, ref) => {
    const labelText = typeof label === "string" ? label : undefined;
    const computedAriaLabel =
      ariaLabel ||
      (labelText
        ? showMinus
          ? `${labelText}, dikecualikan`
          : showCheck || (selected && variant === "accent-solid")
          ? `${labelText}, disertakan`
          : labelText
        : undefined);

    return (
      <button
        ref={ref}
        {...props}
        aria-label={computedAriaLabel}
        aria-pressed={selected}
        className={cn(
          "h-[36px] px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-[0.98] shrink-0",
          variant === "inverted" && "bg-text-primary text-surface-base border-transparent shadow-xs",
          variant === "accent-subtle" && "bg-accent/10 border-accent/30 text-accent",
          variant === "accent-solid" && "bg-accent text-white border-transparent shadow-xs",
          variant === "error-solid" && "bg-semantic-error text-white border-transparent shadow-xs",
          variant === "offline" && "bg-semantic-error/10 border-semantic-error/20 text-semantic-error hover:bg-semantic-error/20",
          variant === "default" && "bg-surface-raised border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary",
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
