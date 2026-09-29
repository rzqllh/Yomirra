import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  beginNavigationIntent,
  endNavigationIntent,
  getNavigationPathname,
  NAVIGATION_INTENT_EVENT,
} from "../navigation-intent";

describe("navigation intent", () => {
  beforeEach(() => {
    endNavigationIntent();
  });

  it("dispatches one intent and suppresses duplicate navigation to the same href", () => {
    const listener = vi.fn();
    window.addEventListener(NAVIGATION_INTENT_EVENT, listener);

    expect(beginNavigationIntent("/library")).toBe(true);
    expect(beginNavigationIntent("/library")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    const event = listener.mock.calls[0][0] as CustomEvent<{ href: string }>;
    expect(event.detail.href).toBe("/library");

    window.removeEventListener(NAVIGATION_INTENT_EVENT, listener);
  });

  it("allows the same href again after the intent is completed", () => {
    expect(beginNavigationIntent("/bookmark")).toBe(true);
    endNavigationIntent();
    expect(beginNavigationIntent("/bookmark")).toBe(true);
  });

  it("extracts the pathname without query or hash", () => {
    expect(getNavigationPathname("/search?q=solo#results")).toBe("/search");
    expect(getNavigationPathname("/")).toBe("/");
  });
});
