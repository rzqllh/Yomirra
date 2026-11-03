import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReaderImage } from "../reader-image";

const gesture = vi.hoisted(() => ({ handlers: {} as Record<string, (...args: any[]) => void>, animate: vi.fn() }));
vi.mock("@use-gesture/react", () => ({ useGesture: (handlers: typeof gesture.handlers) => { gesture.handlers = handlers; } }));
vi.mock("motion/react", async (importOriginal) => ({ ...await importOriginal<typeof import("motion/react")>(), animate: gesture.animate }));
vi.mock("next/image", () => ({ default: ({ unoptimized, priority, ...props }: any) => {
  void unoptimized; void priority;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} />;
} }));

describe("ReaderImage zoom gestures", () => {
  let now = 10_000;
  beforeEach(() => {
    now = 10_000;
    gesture.animate.mockClear();
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove("is-pinching");
  });
  function doubleTap() {
    const container = screen.getByRole("img").closest(".reader-page-container")!;
    for (let tap = 0; tap < 2; tap++) {
      const event = new Event("pointerdown", { bubbles: true });
      Object.defineProperty(event, "isPrimary", { value: true });
      fireEvent(container, event);
      now += 100;
    }
  }
  const props = { pageIndex: 0, pageUrl: "https://example.com/page.jpg", isWebtoon: false, dataSaver: false, isAllowedToLoad: true, onLoadComplete: vi.fn(), onError: vi.fn() };

  it("keeps a newly started double-tap spring when the same pointer gesture ends", () => {
    render(<ReaderImage {...props} />);
    doubleTap();
    expect(gesture.animate.mock.calls.map(call => call[1])).toEqual([2.2]);
    // Motion has not advanced from 1x yet, as with a fast real pointer-up.
    act(() => gesture.handlers.onDragEnd());
    expect(gesture.animate.mock.calls.map(call => call[1])).toEqual([2.2]);
    expect(document.documentElement.classList.contains("is-pinching")).toBe(true);
    // A deliberate pinch back to 1x must still reset normally.
    act(() => gesture.handlers.onPinchEnd({ offset: [1] }));
    expect(gesture.animate.mock.calls.map(call => call[1])).toEqual([2.2, 1, 0, 0]);
  });

  it("disables double-tap while preserving pinch zoom", () => {
    render(<ReaderImage {...props} disableDoubleTapZoom />);
    doubleTap();
    expect(gesture.animate).not.toHaveBeenCalled();
    act(() => gesture.handlers.onPinch({ offset: [2], event: { preventDefault: vi.fn() } }));
    expect(document.documentElement.classList.contains("is-pinching")).toBe(true);
  });
});
