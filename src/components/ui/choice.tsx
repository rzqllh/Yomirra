import * as React from "react";
import { Check, Circle } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface ChoiceProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  kind?: "checkbox" | "radio";
  label: string;
}

/** One native input, one consistent Ink indicator; keyboard and form semantics stay intact. */
export const Choice = React.forwardRef<HTMLInputElement, ChoiceProps>(
  ({ kind = "checkbox", label, className, disabled, ...props }, ref) => (
    <label className={cn("inline-flex min-h-11 items-center gap-2.5 text-sm font-semibold text-text-primary", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", className)}>
      <input ref={ref} className="peer sr-only" type={kind} disabled={disabled} {...props} />
      <span aria-hidden="true" className={cn(
        "grid size-[23px] shrink-0 place-items-center border-[1.5px] border-border-strong bg-surface-overlay text-accent-on motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-300 peer-checked:border-accent peer-checked:bg-accent peer-checked:[&>svg]:scale-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-accent",
        kind === "radio" ? "rounded-full peer-checked:bg-accent-dim peer-checked:text-accent" : "rounded-[7px]"
      )}>
        {kind === "radio" ? <Circle size={10} weight="fill" className="scale-0 motion-safe:transition-transform motion-safe:duration-300" /> : <Check size={15} weight="bold" className="scale-0 motion-safe:transition-transform motion-safe:duration-300" />}
      </span>
      <span>{label}</span>
    </label>
  )
);
Choice.displayName = "Choice";
