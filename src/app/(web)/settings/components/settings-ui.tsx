import * as React from "react";
import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-overlay border border-border-subtle rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle bg-surface-muted/30">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          {title}
        </h2>
      </div>
      <div className="flex flex-col p-2">
        {children}
      </div>
    </section>
  );
}

export type IconVariant = "default" | "accent" | "danger";

export function IconWrapper({ 
  children, 
  variant = "default",
  className
}: { 
  children: React.ReactNode; 
  variant?: IconVariant;
  className?: string;
}) {
  const styles: Record<IconVariant, string> = {
    default: "bg-surface-muted border border-border-subtle text-text-primary",
    accent: "bg-accent/10 text-accent",
    danger: "bg-semantic-error/10 border border-semantic-error/20 text-semantic-error",
  };

  return (
    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", styles[variant], className)}>
      {children}
    </div>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  wrapOnMobile?: boolean;
}

export function SettingsItem({
  icon,
  title,
  description,
  right,
  onClick,
  danger,
  disabled,
  className,
  wrapOnMobile = false
}: SettingsItemProps) {
  const isInteractive = !!onClick;
  const Wrapper = isInteractive ? "button" : "div";

  return (
    <Wrapper
      onClick={isInteractive && !disabled ? onClick : undefined}
      disabled={disabled}
      className={cn(
        "flex justify-between p-3 rounded-lg text-left transition-colors gap-3 w-full",
        wrapOnMobile ? "flex-col sm:flex-row items-start sm:items-center" : "items-center",
        isInteractive && !disabled && (danger ? "hover:bg-semantic-error/10 group" : "hover:bg-surface-hover group"),
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn("flex items-center gap-3", wrapOnMobile ? "w-full sm:w-auto min-w-0" : "min-w-0")}>
        {icon}
        <div className="min-w-0">
          <div className={cn("text-sm font-bold truncate", danger ? "text-semantic-error" : "text-text-primary")}>
            {title}
          </div>
          {description && (
            <div className={cn("text-xs mt-0.5", wrapOnMobile ? "" : "line-clamp-2", danger ? "text-semantic-error/70" : "text-text-secondary max-w-md")}>
              {description}
            </div>
          )}
        </div>
      </div>
      
      {(right || isInteractive) && (
        <div className={cn("flex items-center gap-2", wrapOnMobile ? "w-full sm:w-auto mt-2 sm:mt-0 shrink-0" : "shrink-0")}>
          {right && <div className={cn(wrapOnMobile ? "flex-1 sm:flex-initial" : "shrink-0")}>{right}</div>}
          {isInteractive && !right && (
            <CaretRight 
              size={16} 
              className={cn(
                "shrink-0 transition-colors",
                danger ? "text-semantic-error/50 group-hover:text-semantic-error" : "text-text-muted group-hover:text-text-primary"
              )} 
            />
          )}
        </div>
      )}
    </Wrapper>
  );
}
