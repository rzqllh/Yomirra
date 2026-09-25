import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

export const mangaCardSurface = cva("", {
  variants: {
    kind: {
      enclosed:
        "rounded-md border border-border-subtle/80 bg-surface-raised shadow-xs transition-[background-color,border-color,box-shadow] duration-200 hover:border-accent/40 hover:bg-surface-hover/70 motion-reduce:transition-none",
      open: "bg-transparent",
      row: "border-b border-border-subtle/70 bg-transparent transition-colors last:border-0 hover:bg-surface-hover motion-reduce:transition-none",
      nested: "rounded-xs border border-border-subtle bg-surface-base shadow-xs",
    },
  },
  defaultVariants: {
    kind: "open",
  },
});

export const mangaCardInteraction = {
  link: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
  title: "transition-colors duration-200 group-hover:text-accent motion-reduce:transition-none",
  coverImage:
    "transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none",
} as const;

type CoverFrameProps = React.ComponentPropsWithoutRef<"div">;

export function MangaCardCoverFrame({ className, ...props }: CoverFrameProps) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] shrink-0 overflow-hidden rounded-xs border border-border-subtle bg-surface-muted",
        className
      )}
      {...props}
    />
  );
}

const titleRecipe = cva("text-text-primary", {
  variants: {
    density: {
      compact: "text-xs font-bold leading-snug sm:text-[13.5px]",
      default: "text-[15px] font-bold leading-snug tracking-tight sm:text-base",
    },
    lines: {
      1: "truncate",
      2: "line-clamp-2",
      3: "line-clamp-3",
    },
  },
  defaultVariants: {
    density: "default",
    lines: 1,
  },
});

type TitleTag = "h2" | "h3" | "h4" | "p" | "span";

export interface MangaCardTitleProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof titleRecipe> {
  as?: TitleTag;
}

export function MangaCardTitle({
  as: Tag = "h3",
  density,
  lines,
  className,
  ...props
}: MangaCardTitleProps) {
  return <Tag className={cn(titleRecipe({ density, lines }), className)} {...props} />;
}

type MetaTag = "div" | "p" | "span";

export interface MangaCardMetaProps extends React.HTMLAttributes<HTMLElement> {
  as?: MetaTag;
}

export function MangaCardMeta({ as: Tag = "span", className, ...props }: MangaCardMetaProps) {
  return (
    <Tag
      className={cn("text-xs font-medium leading-normal text-text-secondary", className)}
      {...props}
    />
  );
}
