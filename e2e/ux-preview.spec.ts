import { expect, test } from "./fixtures";

for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 375 }]) {
  test(`preview menus and expanded help remain reachable at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem("yomirra-onboarding", JSON.stringify({ state: { hasCompletedOnboarding: true }, version: 0 }));
    });
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("splash-screen")).toHaveCount(0);
    const trigger = page.getByRole("button", { name: /^Bahasa utama:/ });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    const box = (await menu.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await expect(menu.getByRole("menuitemradio", { checked: true })).toHaveCount(1);
    await menu.getByRole("menuitemradio", { name: "English", exact: true }).click();
    await expect(trigger).toHaveAccessibleName("Bahasa utama: English");
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: info.outputPath("settings-preview.png") });

    await page.goto("/help", { waitUntil: "domcontentloaded" });
    const lastTopic = page.locator("summary").last();
    await lastTopic.click();
    const link = page.locator("details[open]").getByRole("link");
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toBeVisible();
    const linkBox = (await link.boundingBox())!;
    const dockBox = (await page.getByRole("navigation", { name: "Navigasi utama" }).boundingBox())!;
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(dockBox.y);
    await link.focus();
    await expect(link).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: info.outputPath("help-expanded.png") });
  });
}
