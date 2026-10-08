import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SegmentedControl } from "../segmented-control";

describe("SegmentedControl - Concentric Radius Architecture & Quick Rail", () => {
  const options = [
    { value: "reading", label: "Sedang Dibaca" },
    { value: "collection", label: "Koleksi", badge: 5 },
    { value: "updates", label: "Updates", badge: "New", badgeVariant: "error" as const },
  ];

  it("applies concentric rounded-xl to container and rounded-md to buttons by default (quick-rail mode)", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={handleChange}
      />
    );

    const outerContainer = container.firstElementChild as HTMLElement;
    // Outer container has rounded-xl with p-1 padding
    expect(outerContainer.className).toContain("rounded-xl");

    // Inner buttons have rounded-md satisfying R_inner = R_outer - padding
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.className).toContain("rounded-md");
    });
  });

  it("applies rounded-full to container and buttons when shape='pill'", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={handleChange}
        shape="pill"
      />
    );

    const outerContainer = container.firstElementChild as HTMLElement;
    expect(outerContainer.className).toContain("rounded-full");

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.className).toContain("rounded-full");
    });
  });

  it("triggers onChange when clicking an inactive tab", () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={handleChange}
      />
    );

    const collectionTab = screen.getByRole("button", { name: /koleksi/i });
    fireEvent.click(collectionTab);
    expect(handleChange).toHaveBeenCalledWith("collection");
  });

  it("exposes the selected state as pressed buttons rather than unlinked tabs", () => {
    render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={vi.fn()}
        ariaLabel="Tampilan rak buku"
      />
    );

    const group = screen.getByRole("group", { name: "Tampilan rak buku" });
    expect(group).toBeDefined();
    expect(screen.getByRole("button", { name: /sedang dibaca/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /koleksi/i }).getAttribute("aria-pressed")).toBe("false");
    expect(group.querySelector("[role=tab]")).toBeNull();
  });

  it("preserves a minimum 44px hit area and keyboard focus feedback", () => {
    render(<SegmentedControl options={options} value="reading" onChange={vi.fn()} />);

    const button = screen.getByRole("button", { name: /koleksi/i });
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("focus-visible:ring-2");
  });

  it("renders badges for options that provide them", () => {
    render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("New")).toBeDefined();
  });
});

