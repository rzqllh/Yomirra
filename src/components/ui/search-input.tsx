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
          "flex items-center gap-3 rounded-full bg-surface-muted/50 px-4 py-2.5 transition-all duration-200 ease-out",
          "hover:bg-surface-muted/80 focus-within:bg-surface-base focus-within:ring-2 focus-within:ring-accent",
          "border border-transparent focus-within:border-accent-dim shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]",
          "dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] dark:bg-[#011E21]/60",
          containerClassName
        )}
      >
        <MagnifyingGlass className="size-5 text-text-muted shrink-0 transition-colors focus-within:text-accent" weight="bold" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            "flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted/70 font-medium w-full min-w-0",
            className
          )}
          {...props}
        />
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
