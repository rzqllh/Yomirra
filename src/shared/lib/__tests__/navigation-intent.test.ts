import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  beginNavigationIntent,
  commitNavigationParent,
  endNavigationIntent,
  getNavigationParentHref,
  getNavigationPathname,
  isNavigationIntentComplete,
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

  it("cleans pending navigation only after the target pathname is reached", () => {
    expect(isNavigationIntentComplete("/library?source=a", "/search")).toBe(false);
    expect(isNavigationIntentComplete("/library?source=a", "/library")).toBe(true);
    expect(isNavigationIntentComplete(null, "/library")).toBe(false);
  });

  it("retains each parent after returning through nested history entries", () => {
    const startHref = window.location.href;
    const startState = window.history.state;
    const shelf = "/bookmark?tab=collection";
    const saved = "/catalog/saved/saved-title";
    const detail = "/manga/source/title";
    try {
      window.history.replaceState(null, "", shelf);
      beginNavigationIntent(saved);
      window.history.replaceState({ appRouter: true }, "", saved);
      commitNavigationParent();
      const savedState = window.history.state;
      expect(savedState.appRouter).toBe(true);

      beginNavigationIntent(detail);
      window.history.replaceState(null, "", detail);
      commitNavigationParent();
      expect(getNavigationParentHref()).toBe(saved);

      window.history.replaceState(savedState, "", saved);
      expect(getNavigationParentHref()).toBe(shelf);
    } finally {
      window.history.replaceState(startState, "", startHref);
    }
  });
});
