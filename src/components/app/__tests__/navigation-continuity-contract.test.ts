import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("navigation continuity contracts", () => {
  it("keeps optimistic pending state but delays visible feedback", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).toContain("setPendingHref(customEvent.detail.href)");
    expect(shell).toContain("useDelayedFlag(");
    expect(shell).toContain("navigationTiming.feedbackDelayMs");
    expect(shell).toContain("showNavigationProgress && pendingHref");
  });

  it("uses route loading boundaries instead of a duplicate full-screen pending surface", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).not.toContain("PendingNavigationSurface");
    expect(shell).not.toContain("pendingIsReader");
  });

  it("keeps recovery timeout as fallback rather than completion logic", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).toContain("isNavigationIntentComplete");
    expect(shell).toContain("navigationTiming.recoveryTimeoutMs");
  });

  it("leaves browser Back/Forward scroll restoration native", () => {
    const shell = read("src/components/app/app-shell.tsx");

    expect(shell).not.toContain('scrollRestoration = "manual"');
    expect(shell).not.toContain("yomirra:scroll:");
  });

  it("returns trigger focus when the command overlay closes without navigation", () => {
    const menu = read("src/components/app/command-menu.tsx");

    expect(menu).toContain("triggerRef.current = document.activeElement");
    expect(menu).toContain("trigger?.focus({ preventScroll: true })");
    expect(menu).toContain("restoreFocusOnCloseRef.current = false");
  });
});
