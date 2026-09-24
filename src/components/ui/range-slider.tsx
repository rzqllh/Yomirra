import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface RangeSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  value: number;
  valueLabel?: string;
}

export const RangeSlider = React.forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ id, label, value, valueLabel, min = 0, max = 100, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const percent = Math.min(100, Math.max(0, (value - Number(min)) / (Number(max) - Number(min) || 1) * 100));
    return (
      <div className={cn("w-full", className)}>
        <label htmlFor={inputId} className="flex items-center justify-between gap-3 text-sm font-semibold text-text-primary">
          <span>{label}</span><output className="rounded-[8px] bg-accent-dim px-2 py-0.5 text-xs font-bold text-accent">{valueLabel ?? String(value)}</output>
        </label>
        <input ref={ref} id={inputId} type="range" min={min} max={max} value={value} className="ink-range mt-2" style={{ "--range-fill": `${percent}%` } as React.CSSProperties} aria-valuetext={valueLabel} {...props} />
      </div>
    );
  }
);
RangeSlider.displayName = "RangeSlider";
