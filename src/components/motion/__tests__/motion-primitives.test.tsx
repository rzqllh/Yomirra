import * as React from "react";
import { render, screen } from "@testing-library/react";
import { BookmarkSimple, Check } from "@phosphor-icons/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let reducedMotion = false;

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
}));

vi.mock("motion/react", () => ({
  useReducedMotion: () => reducedMotion,
  motion: {
    span: ({
      children,
      transition,
      animate: _animate,
      initial: _initial,
      ...props
    }: React.HTMLAttributes<HTMLSpanElement> & {
      children?: React.ReactNode;
      transition?: unknown;
      animate?: unknown;
      initial?: unknown;
    }) => (
      <span data-transition={JSON.stringify(transition)} {...props}>
        {children}
      </span>
    ),
    div: ({
      children,
      transition,
      animate: _animate,
      initial: _initial,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      transition?: unknown;
      animate?: unknown;
      initial?: unknown;
    }) => (
      <div data-transition={JSON.stringify(transition)} {...props}>
        {children}
      </div>
    ),
  },
}));

import { AnimatedStateIcon } from "../animated-state-icon";
import { PageTransition } from "../page-transition";

describe("motion primitives", () => {
  beforeEach(() => {
    reducedMotion = false;
  });

  it("keeps a stable accessible state-icon wrapper", () => {
    render(
      <AnimatedStateIcon
        active
        inactiveIcon={BookmarkSimple}
        activeIcon={Check}
        label="Tersimpan"
      />
    );

    expect(screen.getByRole("img", { name: "Tersimpan" })).toBeDefined();
    expect(document.querySelectorAll("svg")).toHaveLength(2);
  });

  it("degrades state-icon motion to an instant update for reduced motion", () => {
    reducedMotion = true;

    render(
      <AnimatedStateIcon
        active
        inactiveIcon={BookmarkSimple}
        activeIcon={Check}
      />
    );

    const transitions = Array.from(
      document.querySelectorAll("[data-transition]")
    ).map((node) => node.getAttribute("data-transition"));

    expect(transitions).toEqual([
      JSON.stringify({ duration: 0 }),
      JSON.stringify({ duration: 0 }),
    ]);
  });

  it("uses the semantic page transition and disables it for reduced motion", () => {
    const { rerender } = render(
      <PageTransition>
        <div>Content</div>
      </PageTransition>
    );

    expect(screen.getByTestId("page-transition").getAttribute("data-transition")).toContain(
      '"duration":0.18'
    );

    reducedMotion = true;
    rerender(
      <PageTransition>
        <div>Content</div>
      </PageTransition>
    );

    expect(screen.getByTestId("page-transition").getAttribute("data-transition")).toBe(
      JSON.stringify({ duration: 0 })
    );
  });
});
