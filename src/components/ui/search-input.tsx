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
          "flex items-center gap-2.5 rounded-full bg-surface-glass backdrop-blur-md px-4 h-[44px] transition-all duration-300 ease-out w-full",
          "hover:bg-surface-hover focus-within:bg-surface-overlay focus-within:-sm",
          "border border-transparent focus-within:--default focus-within:ring-2 focus-within:ring-accent/20",
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
        {value && onClear && (
          <IconButton
            type="button"
            onClick={handleClear}
            variant="ghost"
            className="text-text-muted hover:text-text-primary p-1 h-auto w-auto"
            aria-label="Clear search"
          >
            <X size={16} weight="bold" />
          </IconButton>
        )}
        {shortcut && (
          <kbd className="hidden lg:inline-flex h-6 select-none items-center gap-1 rounded-sm border border-border-default bg-surface-base px-2 font-mono text-[11px] font-bold text-text-muted">
            {shortcut}
          </kbd>
        )}
      </form>
    )
  }
)

SearchInput.displayName = "SearchInput"
