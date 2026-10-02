import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterDrawerShell } from "../filter-drawer-shell";

// Mock vaul Drawer
vi.mock("vaul", () => ({
  Drawer: {
    Root: ({ children }: any) => <div data-testid="drawer-root">{children}</div>,
    Trigger: ({ children }: any) => <div data-testid="drawer-trigger">{children}</div>,
    Portal: ({ children }: any) => <div data-testid="drawer-portal">{children}</div>,
    Overlay: ({ className }: any) => <div data-testid="drawer-overlay" className={className} />,
    Content: ({ children, className, style }: any) => (
      <div data-testid="drawer-content" className={className} style={style}>
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

    const content = screen.getByTestId("drawer-content");
    expect(content.className).toContain("overflow-hidden");

    const child = screen.getByTestId("filter-child");
    const scrollRegion = child.parentElement?.parentElement;
    expect(scrollRegion?.className).toContain("min-h-0");

    const applyButton = screen.getByRole("button", { name: /Terapkan Filter/i });
    const footer = applyButton.parentElement;
    expect(footer?.getAttribute("style")).toContain("var(--safe-bottom)");
    expect(screen.getByTestId("drawer-overlay").className).toContain("z-[var(--z-drawer)]");
    expect(content.className).toContain("z-[var(--z-overlay)]");
  });

  it("caps drawer height to the visual viewport when available", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "visualViewport");
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        height: 480,
        addEventListener,
        removeEventListener,
      },
    });

    try {
      render(
        <FilterDrawerShell
          title="Filter"
          description="Filter description"
          activeCount={0}
          onApply={vi.fn()}
          onReset={vi.fn()}
        >
          <div>Filter content</div>
        </FilterDrawerShell>
      );

      await waitFor(() => {
        expect(screen.getByTestId("drawer-content").style.maxHeight).toBe("480px");
      });
      expect(addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "visualViewport", originalDescriptor);
      } else {
        Reflect.deleteProperty(window, "visualViewport");
      }
    }
  });
});
