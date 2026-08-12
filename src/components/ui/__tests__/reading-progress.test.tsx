import React from "react";
import { render, screen } from "@testing-library/react";
import { ReadingProgress } from "../reading-progress";
import { describe, it, expect } from "vitest";

describe("ReadingProgress", () => {
  it("renders progressbar with correct value and aria attributes", () => {
    const { container } = render(<ReadingProgress value={75} />);

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).not.toBeNull();
    expect(progressbar?.getAttribute("aria-valuenow")).toBe("75");
    expect(progressbar?.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar?.getAttribute("aria-valuemax")).toBe("100");
  });

  it("clamps values under 0 and over 100", () => {
    const { container, rerender } = render(<ReadingProgress value={120} />);
    let progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar?.getAttribute("aria-valuenow")).toBe("100");

    rerender(<ReadingProgress value={-15} />);
    progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("renders percentage text label when showLabel is true", () => {
    render(<ReadingProgress value={45.6} showLabel={true} />);

    expect(screen.getByText("46%")).not.toBeNull();
  });

  it("does not render percentage text when showLabel is false", () => {
    render(<ReadingProgress value={50} showLabel={false} />);

    expect(screen.queryByText("50%")).toBeNull();
  });
});
