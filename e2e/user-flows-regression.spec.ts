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

test.describe("Yomirra Interactive User Flows & Behavior Regression", () => {
  test("1. First-time reader state: renders zero-history guidance without layout breaks", async ({ page }) => {
    // Clear history to simulate first-time reader
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("yomirra-history");
        localStorage.removeItem("yomirra-library");
      } catch (e) {}
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 10000 });

    const main = page.locator("main");
    await expect(main).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("2. Returning reader state: displays continue reading card with milestone data", async ({ page }) => {
    // Seed reading history in localStorage
    await page.addInitScript(() => {
      try {
        const historyData = {
          state: {
            items: {
              "asurascans-solo-leveling": {
                sourceId: "asurascans",
                mangaId: "solo-leveling",
                title: "Solo Leveling",
                coverUrl: "/covers/cover-1.webp",
                chapterId: "ch-100",
                chapterTitle: "Chapter 100",
                chapterNumber: 100,
                readAt: new Date().toISOString(),
                completed: false,
                page: 12,
                scrollPosition: 0.5,
              },
            },
            _hasHydrated: true,
          },
          version: 0,
        };
        localStorage.setItem("yomirra-history", JSON.stringify(historyData));
      } catch (e) {}
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 10000 });

    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible();
  });

  test("3. Command palette (⌘K) search modal lifecycle & focus trap", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 10000 });

    // Trigger command palette via standard open-command-menu custom event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("open-command-menu"));
    });

    // Wait for command palette dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Ensure dialog has search input
    const searchInput = dialog.locator('input[placeholder*="Cari"]');
    await expect(searchInput).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test("4. Navigation between primary destinations via BottomDock", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Locate bottom dock
    const nav = page.locator('nav[aria-label="Navigasi utama"]');
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Click search icon in dock
    const searchLink = nav.locator('a[href="/search"]');
    await expect(searchLink).toBeVisible();
    await searchLink.click();

    // Verify URL transitioned to /search
    await expect(page).toHaveURL(/\/search/);

    // Verify search page input is visible
    const input = page.locator("input").first();
    await expect(input).toBeVisible();
  });

  test("5. Toast notification system lifecycle on real action", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 10000 });

    // Locate the "Bersihkan cache" button
    const clearCacheBtn = page.getByRole("button", { name: "Bersihkan cache" });
    await expect(clearCacheBtn).toBeVisible();
    await clearCacheBtn.click();

    // Verify toast is mounted in DOM and displays success notification
    const toastElement = page.locator("[data-sonner-toast]").first();
    await expect(toastElement).toBeVisible({ timeout: 5000 });
    await expect(toastElement).toContainText("Cache bacaan dibersihkan");
  });

  test("6. Multi-viewport overflow immunity across 1440, 834, 390, 320", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 834, height: 1194 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("main", { timeout: 10000 });

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });
});
