import { expect, test } from "@playwright/test";

for (const [width, theme] of [[320, "light"], [360, "dark"]] as const) {
  test(`dock fits ${width}px in ${theme} and tracks back/forward horizontally`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
      localStorage.setItem("yomirra-onboarding", JSON.stringify({
        state: { hasCompletedOnboarding: true }, version: 0,
      }));
    }, theme);
    await page.goto("/search");
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));

    await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 30_000 });
    const dock = page.getByRole("navigation", { name: "Navigasi utama" });
    const pill = dock.locator(".yomirra-dock-indicator[data-visible]");
    await expect(pill).toBeVisible({ timeout: 30_000 });
    const first = (await pill.boundingBox())!;
    expect(first.x).toBeGreaterThanOrEqual(0);
    expect(first.x + first.width).toBeLessThanOrEqual(width);

    await dock.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL(/\/bookmark$/);
    await expect(dock.getByRole("link", { name: "Library", current: "page" })).toBeVisible();
    await expect.poll(async () => (await pill.boundingBox())!.x).toBeLessThan(first.x - 10);
    expect((await pill.boundingBox())!.y).toBeCloseTo(first.y, 0);

    await page.goBack();
    await expect(page).toHaveURL(/\/search$/);
    await expect.poll(async () => Math.abs((await pill.boundingBox())!.x - first.x)).toBeLessThan(1);
    await page.goForward();
    await expect(page).toHaveURL(/\/bookmark$/);
    await expect(dock.getByRole("link", { name: "Library", current: "page" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("desktop onboarding keeps the primary action in view and supports the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/settings");
  const dialog = page.getByRole("dialog");
  const next = dialog.getByRole("button", { name: "Lanjut" });
  await expect(next).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Langkah 1", current: "step" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("button", { name: "Langkah 2", current: "step" })).toBeVisible();
  await dialog.getByRole("button", { name: "Lewati" }).click();
  await expect(dialog).toHaveCount(0);
});

test("desktop settings remain keyboard-scrollable without a visible scrollbar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 620 });
  await page.addInitScript(() => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true }, version: 0,
    }));
  });
  await page.goto("/settings");
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  expect(await page.locator("html").evaluate((element) => {
    return getComputedStyle(element).scrollbarWidth === "none" ||
      getComputedStyle(element, "::-webkit-scrollbar").display === "none";
  })).toBe(true);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
