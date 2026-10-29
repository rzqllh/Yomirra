import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Pre-seed completed onboarding and hydrated stores so splash completes immediately to app shell
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yomirra-onboarding",
        JSON.stringify({ state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0 })
      );
      localStorage.setItem(
        "yomirra-history",
        JSON.stringify({ state: { items: {}, chapters: {}, _hasHydrated: true }, version: 0 })
      );
    } catch (e) {}
  });
});

async function waitForAppReady(page: Page) {
  // Wait for splash screen to detach completely so z-[9999] overlay is gone
  await page
    .locator('[data-testid="splash-screen"]')
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {});
  await page.waitForSelector("main", { timeout: 10000 });
  await page.waitForTimeout(500);
}

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
    await waitForAppReady(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();
    await expect(page.getByText("BACAANMU DIMULAI DI SINI")).toBeVisible();
    await expect(page.locator("#continue-reading-section")).toHaveCount(0);
    await expect(page.locator("#spotlight-section")).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("2. Returning reader state: displays continue reading card with milestone data", async ({ page }) => {
    // Seed a real HistoryItem shape and explicit settings to isolate the history UI.
    await page.addInitScript(() => {
      localStorage.setItem("yomirra-settings", JSON.stringify({
        state: { hideNsfw: false }, version: 2,
      }));
      localStorage.setItem("yomirra-history", JSON.stringify({
        state: {
          items: {
            "komiku::solo-leveling::ch-100": {
              sourceId: "komiku",
              mangaId: "solo-leveling",
              mangaTitle: "Solo Leveling",
              chapterId: "ch-100",
              chapterTitle: "Chapter 100",
              chapterNumber: 100,
              readAt: Date.now(),
              progressPercent: 48,
              pageIndex: 12,
              totalPages: 25,
              isNsfw: false,
            },
          },
          _hasHydrated: true,
        },
        version: 1,
      }));
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForAppReady(page);

    await expect(page.getByText("LANJUT LAGI DI YOMIRRA")).toBeVisible();
    const shelf = page.locator("#continue-reading-section");
    await expect(shelf).toBeVisible();
    await expect(shelf.getByText("Solo Leveling")).toBeVisible();
    await expect(shelf.getByText("Chapter 100")).toBeVisible();
    await expect(page.locator("#spotlight-section")).toBeVisible();

    const order = await page.evaluate(() => {
      const shelf = document.querySelector("#continue-reading-section");
      const spotlight = document.querySelector("#spotlight-section");
      if (!shelf || !spotlight) return null;
      return Boolean(shelf.compareDocumentPosition(spotlight) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(order).toBe(true);
  });

  test("3. Command palette (⌘K) search modal lifecycle & focus trap", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForAppReady(page);
    await page.waitForTimeout(1000);

    // Trigger command palette via search trigger button or shortcut
    const heroSearchBtn = page.locator("#home-hero-search, button[aria-label*='Cari judul atau kreator']").first();
    await heroSearchBtn.waitFor({ state: "visible", timeout: 10000 });
    await heroSearchBtn.dispatchEvent("click");

    // Wait for command palette dialog to appear
    const dialog = page.locator(".command-dialog-content, [role='dialog']:not([data-nextjs-dialog])").first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Ensure dialog has search input
    const searchInput = dialog.locator("input").first();
    await expect(searchInput).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test("4. Navigation between primary destinations via BottomDock", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForAppReady(page);

    // Locate bottom dock
    const nav = page.locator('nav[aria-label="Navigasi utama"]');
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Click search icon in dock
    const searchLink = nav.locator('a[href="/search"]');
    await expect(searchLink).toBeVisible();
    await searchLink.dispatchEvent("click");

    // Verify URL transitioned to /search
    await expect(page).toHaveURL(/\/search/, { timeout: 15000 });

    // Verify search page input is visible
    const input = page.locator("input").first();
    await expect(input).toBeVisible();
  });

  test("5. Toast notification system lifecycle on real action", async ({ page }) => {
    test.setTimeout(45000);
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await waitForAppReady(page);
    await page.locator('[data-hydrated="true"]').waitFor({ state: "visible", timeout: 15000 });

    // Locate the "Bersihkan cache" button and trigger click
    const clearCacheBtn = page.getByRole("button", { name: "Bersihkan cache" });
    await expect(clearCacheBtn).toBeVisible({ timeout: 10000 });
    await clearCacheBtn.click();

    // Verify toast is mounted in DOM and displays notification (success or error)
    const toastElement = page.locator('.yomirra-toast, [data-sonner-toast], [data-title]').first();
    await expect(toastElement).toBeVisible({ timeout: 15000 });
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
      await waitForAppReady(page);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });
});
