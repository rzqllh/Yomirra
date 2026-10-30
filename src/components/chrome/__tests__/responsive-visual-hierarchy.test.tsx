import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DesktopRail } from "@/components/chrome/desktop-rail";
import { useSidebarStore } from "@/shared/store/sidebar-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/library",
}));

vi.mock("@/shared/lib/navigation-intent", () => ({
  beginNavigationIntent: () => true,
  getNavigationPathname: (value: string) => value,
}));

describe("DesktopRail responsive, motion and navigation contracts", () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false });
  });

  it("renders an expanded rail and collapses the actual component with the shared state", () => {
    const { container } = render(<DesktopRail />);
    const rail = container.querySelector("aside");
    expect(rail).not.toBeNull();
    expect(rail?.className).toContain("xl:w-[240px]");

    fireEvent.click(screen.getByRole("button", { name: "Ciutkan bilah samping" }));

    expect(useSidebarStore.getState().isCollapsed).toBe(true);
    expect(rail?.className).toContain("w-[76px]");
    expect(rail?.className).not.toContain("xl:w-[240px]");
    expect(screen.getByRole("button", { name: "Perluas bilah samping" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("exposes a real labelled navigation landmark and current destination", () => {
    render(<DesktopRail />);
    const nav = screen.getByRole("navigation", { name: "Navigasi desktop" });
    const library = within(nav).getByRole("link", { name: "Library" });
    expect(library.getAttribute("href")).toBe("/library");
    expect(library.getAttribute("aria-current")).toBe("page");
  });

  it("includes a reduced-motion override on the actual rail, not a fabricated class string", () => {
    const { container } = render(<DesktopRail />);
    const rail = container.querySelector("aside");
    expect(rail?.className).toContain("motion-reduce:transition-none");
    expect(rail?.className).toContain("border-border-subtle");
  });
});
