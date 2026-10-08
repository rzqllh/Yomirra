import * as React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshRouter = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshRouter }),
}));

vi.mock("motion/react", () => {
  const distance = { set: vi.fn(), get: () => 0 };
  return {
    motion: {
      div: ({
        children,
        animate: _animate,
        transition: _transition,
        style: _style,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & {
        animate?: unknown;
        transition?: unknown;
      }) => <div {...props}>{children}</div>,
    },
    useReducedMotion: () => false,
    useSpring: () => distance,
    useTransform: () => 0,
  };
});

import { PullToRefresh } from "../pull-to-refresh";

function sendTouch(type: "touchstart" | "touchmove" | "touchend" | "touchcancel", x: number, y: number, target: EventTarget = window) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value: type === "touchend" || type === "touchcancel" ? [] : [{ clientX: x, clientY: y }],
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("PullToRefresh gesture continuity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not intercept an iOS edge swipe", () => {
    const onRefresh = vi.fn();
    render(<PullToRefresh onRefresh={onRefresh}><div>Content</div></PullToRefresh>);

    sendTouch("touchstart", 10, 100);
    const move = sendTouch("touchmove", 10, 400);
    sendTouch("touchend", 10, 400);

    expect(move.defaultPrevented).toBe(false);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("leaves horizontal scrolling gestures to the browser", () => {
    const onRefresh = vi.fn();
    render(<PullToRefresh onRefresh={onRefresh}><div>Content</div></PullToRefresh>);

    sendTouch("touchstart", 100, 100);
    const horizontalMove = sendTouch("touchmove", 180, 110);
    const secondMove = sendTouch("touchmove", 180, 450);
    sendTouch("touchend", 180, 450);

    expect(horizontalMove.defaultPrevented).toBe(false);
    expect(secondMove.defaultPrevented).toBe(false);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("refreshes on a real downward pull past the threshold", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<PullToRefresh onRefresh={onRefresh}><div>Content</div></PullToRefresh>);

    sendTouch("touchstart", 100, 100);
    const move = sendTouch("touchmove", 102, 360);
    sendTouch("touchend", 102, 360);

    expect(move.defaultPrevented).toBe(true);
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });

  it("does not refresh when the touch is canceled", () => {
    const onRefresh = vi.fn();
    render(<PullToRefresh onRefresh={onRefresh}><div>Content</div></PullToRefresh>);

    sendTouch("touchstart", 100, 100);
    sendTouch("touchmove", 100, 380);
    sendTouch("touchcancel", 100, 380);

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("never intercepts gestures inside modal content", () => {
    const onRefresh = vi.fn();
    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <div role="dialog"><div data-testid="modal-content">Dialog</div></div>
      </PullToRefresh>
    );
    const dialogContent = container.querySelector('[data-testid="modal-content"]')!;

    sendTouch("touchstart", 100, 100, dialogContent);
    const move = sendTouch("touchmove", 100, 390, dialogContent);
    sendTouch("touchend", 100, 390, dialogContent);

    expect(move.defaultPrevented).toBe(false);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
