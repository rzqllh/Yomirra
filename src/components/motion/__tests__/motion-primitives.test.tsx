import * as React from "react";
import { render, screen } from "@testing-library/react";
import { BookmarkSimple, Check } from "@phosphor-icons/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let reducedMotion = false;
let lastPageTransitionOnUpdate: unknown;
let lastSpotlightOnUpdate: unknown;
let spotlightInitials: unknown[] = [];

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      transition?: unknown;
      animate?: unknown;
      initial?: unknown;
      onUpdate?: unknown;
    }) => {
      if ((rest as Record<string, unknown>)["data-testid"] === "page-transition") {
        lastPageTransitionOnUpdate = rest.onUpdate;
      }
      if ((rest as Record<string, unknown>)["data-testid"] === "editorial-spotlight-slide") {
        lastSpotlightOnUpdate = rest.onUpdate;
        spotlightInitials.push(rest.initial);
      }
      const domProps = Object.fromEntries(
        Object.entries(rest).filter(
          ([key]) => key !== "animate" && key !== "initial" && key !== "onUpdate"
        )
      ) as React.HTMLAttributes<HTMLDivElement>;
      return (
        <div data-transition={JSON.stringify(transition)} {...domProps}>
          {children}
        </div>
      );
    },
  },
}));

import { AnimatedStateIcon } from "../animated-state-icon";
import { PageTransition } from "../page-transition";
import { EditorialSpotlight } from "@/components/home/editorial-spotlight";

describe("motion primitives", () => {
  beforeEach(() => {
    reducedMotion = false;
    lastPageTransitionOnUpdate = undefined;
    lastSpotlightOnUpdate = undefined;
    spotlightInitials = [];
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

    expect(typeof lastPageTransitionOnUpdate).toBe("function");
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

  it("wires EditorialSpotlight slide with onUpdate callback and skips initial entrance WAAPI on first mount", () => {
    const { rerender } = render(
      <EditorialSpotlight
        manga={{
          id: "manga-1",
          title: "Manga One",
          coverUrl: "/cover-1.jpg",
          description: "Ringkasan satu",
          contentRating: "safe",
        }}
        sourceId="source-a"
        sourceName="Source A"
      />
    );

    expect(typeof lastSpotlightOnUpdate).toBe("function");
    expect(spotlightInitials[0]).toBe(false);

    rerender(
      <EditorialSpotlight
        manga={{
          id: "manga-2",
          title: "Manga Two",
          coverUrl: "/cover-2.jpg",
          description: "Ringkasan dua",
          contentRating: "safe",
        }}
        sourceId="source-a"
        sourceName="Source A"
        direction={1}
      />
    );

    expect(spotlightInitials.at(-1)).toEqual({ opacity: 0.92, x: 8 });
  });
});
