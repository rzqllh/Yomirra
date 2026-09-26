import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { MangaGrid, MANGA_GRID_CLASS, MANGA_COMPACT_GRID_CLASS } from "../manga-grid";

describe("MangaGrid deterministic layout", () => {
  it("renders a standard div element without motion layout", () => {
    const { container } = render(
      <MangaGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </MangaGrid>
    );

    const gridEl = container.firstElementChild as HTMLElement;
    expect(gridEl.tagName).toBe("DIV");
    expect(gridEl.className).toContain("grid");
    // Verify standard grid classes are applied
    expect(gridEl.className).toContain("grid-cols-2");
  });

  it("applies standard grid classes in default grid viewMode", () => {
    const { container } = render(
      <MangaGrid viewMode="grid">
        <div>Card</div>
      </MangaGrid>
    );

    const gridEl = container.firstElementChild as HTMLElement;
    expect(gridEl.className).toBe(MANGA_GRID_CLASS);
  });

  it("applies compact grid classes in compact viewMode", () => {
    const { container } = render(
      <MangaGrid viewMode="compact">
        <div>Card</div>
      </MangaGrid>
    );

    const gridEl = container.firstElementChild as HTMLElement;
    expect(gridEl.className).toBe(MANGA_COMPACT_GRID_CLASS);
  });
});
