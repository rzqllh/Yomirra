import * as React from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmitAction?: (e: React.FormEvent, value: string) => void;
  shortcut?: string;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, onSubmitAction, shortcut, value, onChange, ...props }, ref) => {
    
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
          "flex items-center gap-3 rounded-full bg-surface-raised px-4 py-2 transition-all duration-[var(--motion-fast)]",
          "hover:bg-surface-overlay focus-within:bg-surface-overlay focus-within:ring-1 focus-within:ring-accent",
          "border border-border-subtle shadow-sm",
          containerClassName
        )}
      >
        <MagnifyingGlass className="size-4 text-text-muted shrink-0" weight="bold" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            "flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted font-medium w-full min-w-0",
            className
          )}
          {...props}
        />
        {shortcut && (
          <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border-strong bg-surface-base px-1.5 font-mono text-[10px] font-bold text-text-muted">
            {shortcut}
          </kbd>
        )}
      </form>
    )
  }
)

SearchInput.displayName = "SearchInput"
