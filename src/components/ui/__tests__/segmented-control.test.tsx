import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SegmentedControl } from "../segmented-control";

describe("SegmentedControl - Concentric Radius Architecture", () => {
  const options = [
    { value: "reading", label: "Sedang Dibaca" },
    { value: "collection", label: "Koleksi" },
    { value: "updates", label: "Updates" },
  ];

  it("applies rounded-full to container and buttons by default (pill mode)", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={handleChange}
      />
    );

    const outerContainer = container.firstElementChild as HTMLElement;
    expect(outerContainer.className).toContain("rounded-full");

    const buttons = screen.getAllByRole("tab");
    buttons.forEach((button) => {
      expect(button.className).toContain("rounded-full");
    });
  });

  it("applies concentric rounded classes when shape='rounded' (R_inner = R_outer - padding)", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SegmentedControl
        options={options}
        value="reading"
        onChange={handleChange}
        shape="rounded"
      />
    );

    const outerContainer = container.firstElementChild as HTMLElement;
    // Outer container has rounded-2xl (16px) with p-1 (4px padding)
    expect(outerContainer.className).toContain("rounded-2xl");

    // Inner buttons have rounded-md (12px = 16px - 4px) to satisfy concentric formula
    const buttons = screen.getAllByRole("tab");
    buttons.forEach((button) => {
      expect(button.className).toContain("rounded-md");
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

    const collectionTab = screen.getByRole("tab", { name: /koleksi/i });
    fireEvent.click(collectionTab);
    expect(handleChange).toHaveBeenCalledWith("collection");
  });
});
