import { test, expect } from "@playwright/test";

for (const viewport of [{ width: 320, height: 568 }, { width: 820, height: 1180 }, { width: 1366, height: 900 }]) {
  test(`Beranda Quick Search centers in the visible viewport at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem("yomirra-onboarding", JSON.stringify({ state: { hasCompletedOnboarding: true }, version: 0 })));
    await page.route("**/api/sources", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [{ id: "komiku", name: "Fixture source", isEnabled: true, isInstalled: true, isNsfw: false, status: "online", capabilities: { search: true } }] }) }));
    await page.goto("/");
    await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0);
    if (viewport.width === 1366) {
      // A classic desktop scrollbar can disappear when Radix locks body scroll,
      // changing visual width without a visualViewport resize notification.
      await page.evaluate(() => Object.defineProperty(window.visualViewport!, "width", { configurable: true, value: innerWidth - 16 }));
    }
    await page.getByRole("button", { name: "Cari komik (Tekan Ctrl+K)", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Quick Search", exact: true });
    await expect(dialog).toBeVisible();
    if (viewport.width === 1366) {
      await page.evaluate(() => Object.defineProperty(window.visualViewport!, "width", { configurable: true, value: innerWidth }));
    }
    const input = dialog.getByRole("combobox", { name: "Quick Search di sumber Jelajah", exact: true });
    await expect(input).toBeFocused();
    expect(await input.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    const centerError = async () => {
      const rect = await dialog.boundingBox();
      const visual = await page.evaluate(() => ({ width: visualViewport?.width ?? innerWidth, height: visualViewport?.height ?? innerHeight, top: visualViewport?.offsetTop ?? 0, left: visualViewport?.offsetLeft ?? 0 }));
      return rect ? Math.max(Math.abs(rect.x + rect.width / 2 - visual.left - visual.width / 2), Math.abs(rect.y + rect.height / 2 - visual.top - visual.height / 2)) : Infinity;
    };
    await expect.poll(centerError).toBeLessThan(3);
    if (viewport.width === 320) {
      // A visualViewport contract simulation, not physical iOS keyboard evidence.
      await page.evaluate(() => {
        Object.defineProperty(window.visualViewport!, "height", { configurable: true, value: 280 });
        Object.defineProperty(window.visualViewport!, "offsetTop", { configurable: true, value: 80 });
        window.visualViewport!.dispatchEvent(new Event("resize"));
      });
      await expect.poll(centerError).toBeLessThan(3);
      const box = await dialog.boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(80);
      expect(box!.y + box!.height).toBeLessThanOrEqual(360);
    }
    await input.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}
