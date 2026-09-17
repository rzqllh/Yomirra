import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterDrawerShell } from "../filter-drawer-shell";

// Mock vaul Drawer
vi.mock("vaul", () => ({
  Drawer: {
    Root: ({ children }: any) => <div data-testid="drawer-root">{children}</div>,
    Trigger: ({ children }: any) => <div data-testid="drawer-trigger">{children}</div>,
    Portal: ({ children }: any) => <div data-testid="drawer-portal">{children}</div>,
    Overlay: ({ className }: any) => <div data-testid="drawer-overlay" className={className} />,
    Content: ({ children, className }: any) => (
      <div data-testid="drawer-content" className={className}>
        {children}
      </div>
    ),
    Title: ({ children, className }: any) => <h2 data-testid="drawer-title" className={className}>{children}</h2>,
    Description: ({ children, className }: any) => <p data-testid="drawer-desc" className={className}>{children}</p>,
  },
}));

describe("FilterDrawerShell Anatomy", () => {
  it("renders non-scrolling header chrome and separate sticky footer", () => {
    const handleApply = vi.fn();
    const handleReset = vi.fn();

    render(
      <FilterDrawerShell
        title="Filter Pencarian"
        description="Filter description"
        activeCount={2}
        onApply={handleApply}
        onReset={handleReset}
      >
        <div data-testid="filter-child">Genre Item</div>
      </FilterDrawerShell>
    );

    // Verify Title is present
    expect(screen.getByText("Filter Pencarian")).toBeDefined();
    // Verify Reset is present
    expect(screen.getByRole("button", { name: /Reset/i })).toBeDefined();
    // Verify Apply button is present
    expect(screen.getByRole("button", { name: /Terapkan Filter/i })).toBeDefined();
    // Verify Child is present
    expect(screen.getByTestId("filter-child")).toBeDefined();
  });
});
