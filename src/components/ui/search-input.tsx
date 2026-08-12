import * as React from "react"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/shared/utils/cn"

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmitAction?: (e: React.FormEvent, value: string) => void;
  onClear?: () => void;
  shortcut?: string;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, onSubmitAction, onClear, shortcut, value, onChange, ...props }, ref) => {
    
    const handleClear = () => {
      onClear?.();
    };
    
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
          "flex items-center gap-2.5 rounded-2xl bg-surface-glass backdrop-blur-md px-4 h-[44px] border border-border-subtle transition-all duration-200 ease-out w-full",
          "hover:bg-surface-hover hover:border-border-strong focus-within:bg-surface-overlay focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20 focus-within:shadow-xs",
          containerClassName
        )}
      >
        <MagnifyingGlass 
          className="size-[18px] text-text-muted shrink-0 transition-colors group-focus-within:text-accent" 
          weight="bold" 
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            "flex-1 bg-transparent text-[14px] font-medium text-text-primary outline-none placeholder:text-text-muted/60 w-full min-w-0 h-full",
            className
          )}
          {...props}
        />
        {value && onClear && (
          <IconButton
            type="button"
            onClick={handleClear}
            variant="ghost"
            className="text-text-muted hover:text-text-primary p-1 h-auto w-auto shrink-0"
            aria-label="Clear search"
          >
            <X size={16} weight="bold" />
          </IconButton>
        )}
        {shortcut && (
          <kbd className="hidden lg:inline-flex h-6 select-none items-center gap-1 rounded-md border border-border-default bg-surface-base px-2 font-mono text-[11px] font-bold text-text-muted">
            {shortcut}
          </kbd>
        )}
      </form>
    )
  }
)

SearchInput.displayName = "SearchInput"
