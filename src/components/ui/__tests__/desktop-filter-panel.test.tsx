import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterDrawerShell } from "../filter-drawer-shell";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("desktop filters", () => {
  it("uses a nonmodal integrated panel, applies without closing, and lets the user collapse it", () => {
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
    expect(screen.queryByText("Genre controls")).toBeNull();
  });
});
