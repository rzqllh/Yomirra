import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { PageContainer } from "../page-container";

describe("PageContainer", () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it("renders children cleanly", async () => {
    await act(async () => {
      root.render(
        <PageContainer>
          <span data-testid="child">Hello PageContainer</span>
        </PageContainer>
      );
    });

    const el = container.querySelector('[data-testid="child"]');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("Hello PageContainer");
  });

  it("applies the canonical layout classes and avoids undefined/scroll tokens", async () => {
    await act(async () => {
      root.render(<PageContainer id="test-container">Content</PageContainer>);
    });

    const el = container.querySelector("#test-container");
    expect(el).not.toBeNull();
    const className = el?.getAttribute("class") || "";

    // Required classes
    expect(className).toContain("w-full");
    expect(className).toContain("max-w-none");
    expect(className).toContain("px-4");
    expect(className).toContain("md:px-8");
    expect(className).toContain("xl:px-10");
    expect(className).toContain("flex");
    expect(className).toContain("flex-col");
    expect(className).toContain("gap-6");

    // Prohibited classes
    expect(className).not.toContain("max-w-9xl");
    expect(className).not.toContain("min-h-screen");
    expect(className).not.toContain("h-screen");
    expect(className).not.toContain("overflow-y-auto");
    expect(className).not.toContain("overflow-y-scroll");
  });

  it("forwards ref to the underlying div", async () => {
    let resolvedRef: HTMLDivElement | null = null;
    const ref = (node: HTMLDivElement | null) => {
      resolvedRef = node;
    };

    await act(async () => {
      root.render(<PageContainer ref={ref}>Ref test</PageContainer>);
    });

    expect(resolvedRef).toBeInstanceOf(HTMLDivElement);
    expect((resolvedRef as unknown as HTMLDivElement)?.textContent).toBe("Ref test");
  });

  it("allows custom className merges", async () => {
    await act(async () => {
      root.render(
        <PageContainer id="custom-test" className="custom-class">
          Content
        </PageContainer>
      );
    });

    const el = container.querySelector("#custom-test");
    expect(el?.getAttribute("class")).toContain("custom-class");
    expect(el?.getAttribute("class")).toContain("w-full");
  });
});
