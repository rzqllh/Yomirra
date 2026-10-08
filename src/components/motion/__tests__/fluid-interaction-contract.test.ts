import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("Yomirra fluid interaction contracts", () => {
  it("keeps page continuity and optimistic feedback at the shell boundary", () => {
    const shell = source("src/components/chrome/app-shell.tsx");
    const pageTransition = source("src/components/motion/page-transition.tsx");
    const dock = source("src/components/chrome/bottom-dock.tsx");

    expect(shell).toContain("<PageTransition>");
    expect(shell).toContain("pendingHref={pendingHref}");
    expect(pageTransition).toContain("useReducedMotion");
    expect(dock).toContain('layoutId="active-dock-tab"');
  });

  it("preserves native edge and horizontal gestures", () => {
    const pull = source("src/components/ui/pull-to-refresh.tsx");

    expect(pull).toContain("EDGE_SWIPE_ZONE");
    expect(pull).toContain("Math.abs(deltaX) >= Math.abs(deltaY)");
    expect(pull).toContain('window.addEventListener("touchcancel"');
    expect(pull).toContain('window.removeEventListener("touchcancel"');
    expect(pull).toContain('target.closest(');
  });

  it("isolates interactive indicator identity and exposes pressed state", () => {
    const segmented = source("src/components/ui/segmented-control.tsx");

    expect(segmented).toContain("React.useId()");
    expect(segmented).toContain("scopedLayoutId");
    expect(segmented).toContain("aria-pressed={isActive}");
    expect(segmented).not.toContain('role="tablist"');
    expect(segmented).not.toContain("aria-controls=");
  });

  it("uses shared motion grammar for primary state transitions", () => {
    const segmented = source("src/components/ui/segmented-control.tsx");
    const reader = source("src/components/reader/reader-shell.tsx");

    expect(segmented).toContain("transitions.layout");
    expect(reader).toContain("transitions.smooth");
    expect(reader).toContain("transitions.snappy");
  });

  it("keeps reading progress and ratings responsive and accessible", () => {
    const readingProgress = source("src/components/ui/reading-progress.tsx");
    const rating = source("src/components/komik/manga-rating.tsx");

    expect(readingProgress).toContain("transition={reducedMotion ? { duration: 0 } : transitions.gentle}");
    expect(rating).toContain("aria-pressed={userRating === rating}");
    expect(rating).toContain("min-h-11");
  });

  it("avoids excessive reader tap motion and respects reduced motion during startup", () => {
    const reader = source("src/components/reader/reader-shell.tsx");
    const splash = source("src/components/overlays/splash-screen.tsx");

    expect(reader).not.toContain("whileTap={{ scale: 0.9 }}");
    expect(reader).toContain("reducedMotion ? undefined : { scale: 0.97 }");
    expect(splash).toContain("useReducedMotion()");
    expect(splash).toContain("animate={reducedMotion ? { scale: 1, opacity: 0.35 }");
    expect(splash).toContain("transition={reducedMotion ? { duration: 0 }");
  });
});
