import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { PageToolbar } from "../page-toolbar";

describe("PageToolbar", () => {
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
        <PageToolbar>
          <div data-testid="primary-row">Primary Row</div>
          <div data-testid="secondary-rail">Secondary Rail</div>
        </PageToolbar>
      );
    });

    const row = container.querySelector('[data-testid="primary-row"]');
    const rail = container.querySelector('[data-testid="secondary-rail"]');
    expect(row).not.toBeNull();
    expect(rail).not.toBeNull();
    expect(row?.textContent).toBe("Primary Row");
    expect(rail?.textContent).toBe("Secondary Rail");
  });

  it("applies the canonical toolbar layout classes", async () => {
    await act(async () => {
      root.render(<PageToolbar id="test-toolbar">Content</PageToolbar>);
    });

    const el = container.querySelector("#test-toolbar");
    expect(el).not.toBeNull();
    const className = el?.getAttribute("class") || "";

    expect(className).toContain("flex");
    expect(className).toContain("flex-col");
    expect(className).toContain("gap-3");
    expect(className).toContain("w-full");
  });

  it("forwards ref to the underlying div", async () => {
    let resolvedRef: HTMLDivElement | null = null;
    const ref = (node: HTMLDivElement | null) => {
      resolvedRef = node;
    };

    await act(async () => {
      root.render(<PageToolbar ref={ref}>Ref test</PageToolbar>);
    });

    expect(resolvedRef).toBeInstanceOf(HTMLDivElement);
    expect((resolvedRef as unknown as HTMLDivElement)?.textContent).toBe("Ref test");
  });

  it("allows custom className merges", async () => {
    await act(async () => {
      root.render(
        <PageToolbar id="custom-toolbar" className="custom-toolbar-class">
          Content
        </PageToolbar>
      );
    });

    const el = container.querySelector("#custom-toolbar");
    expect(el?.getAttribute("class")).toContain("custom-toolbar-class");
    expect(el?.getAttribute("class")).toContain("w-full");
  });
});
