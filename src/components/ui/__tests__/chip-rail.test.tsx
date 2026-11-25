import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChipRail } from "../chip-rail";

describe("ChipRail", () => {
  it("renders children inside a scrollable container with bleed by default", () => {
    const { container } = render(
      <ChipRail role="group" aria-label="Filter test">
        <button type="button">Chip 1</button>
        <button type="button">Chip 2</button>
      </ChipRail>
    );

    const rail = screen.getByRole("group", { name: "Filter test" });
    expect(rail).toBeTruthy();
    expect(rail.className).toContain("overflow-x-auto");
    expect(rail.className).toContain("-mx-4");
    expect(rail.className).toContain("px-4");
    expect(rail.className).toContain("touch-pan-x");
    expect(screen.getByText("Chip 1")).toBeTruthy();
    expect(screen.getByText("Chip 2")).toBeTruthy();
  });

  it("supports bleed=false without negative margin bleed", () => {
    render(
      <ChipRail bleed={false} role="group" aria-label="Filter without bleed">
        <button type="button">Chip A</button>
      </ChipRail>
    );

    const rail = screen.getByRole("group", { name: "Filter without bleed" });
    expect(rail.className).not.toContain("-mx-4");
    expect(rail.className).not.toContain("px-4");
    expect(rail.className).toContain("overflow-x-auto");
  });

  it("merges custom className overrides", () => {
    render(
      <ChipRail className="custom-test-rail" role="region" aria-label="Custom rail">
        <span>Content</span>
      </ChipRail>
    );

    const rail = screen.getByRole("region", { name: "Custom rail" });
    expect(rail.className).toContain("custom-test-rail");
  });
});
