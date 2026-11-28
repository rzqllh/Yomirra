import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterDrawerShell, FilterSection } from "../filter-drawer-shell";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("desktop filters", () => {
  it("uses a nonmodal integrated panel, applies without closing, and lets the user collapse it", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)));
    const apply = vi.fn();
    render(<><div id="test-filter-panel" /><FilterDrawerShell title="Filter Jelajah" description="Filters" activeCount={0} onApply={apply} onReset={vi.fn()} desktopPortalId="test-filter-panel"><p>Genre controls</p></FilterDrawerShell></>);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("region", { name: "Filter Jelajah" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Filter$/ }));
    expect(screen.getByRole("region", { name: "Filter Jelajah" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Terapkan Filter" }));
    expect(apply).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Genre controls")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Filter$/ }));
    await waitFor(() => {
      expect(screen.queryByText("Genre controls")).toBeNull();
    });
  });

  it("renders primary apply button, supports FilterSection className, and returns focus on Escape", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)));
    render(
      <>
        <div id="test-filter-panel" />
        <FilterDrawerShell title="Filter Jelajah" description="Filters" activeCount={0} onApply={vi.fn()} onReset={vi.fn()} desktopPortalId="test-filter-panel">
          <FilterSection title="Genre" layout="wrap" className="col-span-full">
            <span>Action</span>
          </FilterSection>
        </FilterDrawerShell>
      </>
    );

    const trigger = screen.getByRole("button", { name: /^Filter$/ });
    fireEvent.click(trigger);

    const applyButton = screen.getByRole("button", { name: "Terapkan Filter" });
    expect(applyButton.className).toContain("bg-accent");

    const genreHeading = screen.getByRole("heading", { name: "Genre" });
    expect(genreHeading.parentElement?.className).toContain("col-span-full");

    applyButton.focus();
    fireEvent.keyDown(applyButton, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "Filter Jelajah" })).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });
});
