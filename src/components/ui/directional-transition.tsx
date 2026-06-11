"use client";

import * as React from "react";
import { ViewTransition } from "react";

/**
 * A wrapper for page-level components to slide in hierarchically based on the
 * transitionType. Used for forward/backward page navigation (like list to detail).
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </ViewTransition>
  );
}
