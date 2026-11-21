"use client";

import Link from "next/link";
import type { ReactNode, FocusEvent } from "react";

/**
 * Native focus scrolling ignores fixed overlays in some mobile browsers.
 * Center the focused help action so the bottom dock never obscures it.
 */
export function HelpTopicLink({ href, children }: { href: string; children: ReactNode }) {
  const handleFocus = (event: FocusEvent<HTMLAnchorElement>) => {
    event.currentTarget.scrollIntoView({ block: "center", inline: "nearest" });
  };

  return (
    <Link
      href={href}
      onFocus={handleFocus}
      className="inline-flex min-h-11 items-center scroll-mb-36 rounded-md font-semibold text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </Link>
  );
}
