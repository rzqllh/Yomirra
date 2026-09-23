import { describe, expect, it } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { StatusBarBlur } from "../status-bar-blur";

describe("StatusBarBlur Component", () => {
  it("renders with correct positioning, pointer-events-none, and safe-top height", () => {
    const { container } = render(<StatusBarBlur />);
    const blurElement = container.firstElementChild as HTMLElement;

    expect(blurElement).toBeDefined();
    expect(blurElement.getAttribute("aria-hidden")).toBe("true");
    expect(blurElement.className).toContain("fixed");
    expect(blurElement.className).toContain("top-0");
    expect(blurElement.className).toContain("pointer-events-none");
    expect(blurElement.className).toContain("h-[env(safe-area-inset-top,0px)]");
    expect(blurElement.className).toContain("max-h-[env(safe-area-inset-top,0px)]");
    const styleAttr = blurElement.getAttribute("style") || "";
    expect(styleAttr).toContain("clip-path: inset(0 0 0 0)");
  });

  it("applies progressive blur mask and custom className", () => {
    const { container } = render(<StatusBarBlur className="custom-class" />);
    const blurElement = container.firstElementChild as HTMLElement;

    expect(blurElement.className).toContain("custom-class");
    const styleAttr = blurElement.getAttribute("style") || "";
    expect(styleAttr).toContain("mask-image");
    expect(styleAttr).toContain("linear-gradient");
  });
});
