import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, render } from "@testing-library/react";
import { useResponsiveToastPosition, Toaster } from "../sonner";

describe("useResponsiveToastPosition", () => {
  const setMockMedia = (matchesLandscape: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("landscape") ? matchesLandscape : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setMockMedia(false);
  });

  it("returns top-right for desktop viewports (>= 1024px)", () => {
    window.innerWidth = 1280;
    setMockMedia(false);

    const { result } = renderHook(() => useResponsiveToastPosition());
    expect(result.current).toBe("top-right");
  });

  it("returns top-right for tablet landscape (768px - 1023px, landscape)", () => {
    window.innerWidth = 850;
    setMockMedia(true);

    const { result } = renderHook(() => useResponsiveToastPosition());
    expect(result.current).toBe("top-right");
  });

  it("returns top-center for tablet portrait (768px - 1023px, portrait)", () => {
    window.innerWidth = 800;
    setMockMedia(false);

    const { result } = renderHook(() => useResponsiveToastPosition());
    expect(result.current).toBe("top-center");
  });

  it("returns top-center for mobile viewports (< 768px)", () => {
    window.innerWidth = 390;
    setMockMedia(false);

    const { result } = renderHook(() => useResponsiveToastPosition());
    expect(result.current).toBe("top-center");
  });

  it("returns top-center for mobile even in landscape mode (< 768px)", () => {
    window.innerWidth = 640;
    setMockMedia(true);

    const { result } = renderHook(() => useResponsiveToastPosition());
    expect(result.current).toBe("top-center");
  });

  it("updates position on window resize event", () => {
    window.innerWidth = 400;
    setMockMedia(false);

    let resizeCallback: (() => void) | null = null;
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "resize") {
        resizeCallback = handler as () => void;
      }
    });

    const { result } = renderHook(() => useResponsiveToastPosition());
    expect(result.current).toBe("top-center");

    act(() => {
      window.innerWidth = 1200;
      if (resizeCallback) resizeCallback();
    });

    expect(result.current).toBe("top-right");
  });
});

describe("Toaster component", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders correctly with auto-resolved responsive position", () => {
    const { container } = render(<Toaster />);
    expect(container).toBeDefined();
  });

  it("accepts an explicit position override if supplied", () => {
    const { container } = render(<Toaster position="top-right" />);
    expect(container).toBeDefined();
  });
});

describe("yToast helper", () => {
  it("exports all standard toast methods cleanly", async () => {
    const { yToast } = await import("../sonner");
    expect(typeof yToast.success).toBe("function");
    expect(typeof yToast.info).toBe("function");
    expect(typeof yToast.warning).toBe("function");
    expect(typeof yToast.error).toBe("function");
    expect(typeof yToast.loading).toBe("function");
    expect(typeof yToast.dismiss).toBe("function");
  });
});

