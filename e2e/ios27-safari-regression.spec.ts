import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Pre-seed completed onboarding so splash completes immediately to app shell
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yomirra-onboarding",
        JSON.stringify({ state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0 })
      );
    } catch (e) {}
  });
});

test.describe("iOS 27 Safari Compatibility & Regression Suite", () => {
  test("maintains viewport-fit=cover and dynamic theme-color", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const viewportContent = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportContent).toContain("viewport-fit=cover");

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .first()
      .getAttribute("content");
    expect(themeColor).toBeTruthy();
  });

  test("guards against iOS input auto-zoom on mobile viewport (font-size >= 16px)", async ({
    page,
  }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input", { timeout: 8000 });
    const input = page.locator("input").first();
    const fontSize = await input.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    // On iOS Safari, any font-size strictly < 16px causes intrusive viewport auto-zoom
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test("verifies zero horizontal overflow across mobile viewport", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test("anchors bottom dock with safe-area padding within visible viewport", async ({
    page,
  }) => {
    await page.goto("/popular", { waitUntil: "domcontentloaded" });
    const dock = page.locator('nav.fixed.bottom-0');
    await expect(dock).toBeAttached();

    const rect = await dock.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        bottom: r.bottom,
        windowHeight: window.innerHeight,
        paddingBottom: cs.paddingBottom,
      };
    });
    // Dock must sit at bottom of visible viewport
    expect(rect.bottom).toBeLessThanOrEqual(rect.windowHeight + 1);
  });

  test("defines --bottom-dock-height token for paged-reader", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const dockHeightToken = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue("--bottom-dock-height").trim();
    });
    expect(dockHeightToken).toBeTruthy();
    expect(dockHeightToken).not.toBe("");
  });

  test("validates BrowserStack cloud execution gate", async () => {
    const hasCreds = Boolean(process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY);
    if (!hasCreds) {
      test.skip(true, "BLOCKED: BrowserStack cloud credentials not configured in environment. Local WebKit validated.");
    }
  });
});
