import { expect, test } from "@playwright/test";

for (const width of [320, 360, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`settings chrome fits ${width}px in ${theme}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
        localStorage.setItem("yomirra-onboarding", JSON.stringify({
          state: { hasCompletedOnboarding: true }, version: 0,
        }));
      }, theme);
      await page.goto("/settings");
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
      await expect(page.getByTestId("splash-screen")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      const nav = page.getByRole("navigation", { name: "Navigasi utama" });
      if (width < 768) {
        await expect(nav).toBeVisible();
        await expect(nav.getByRole("link", { name: "Beranda" })).toBeVisible();
      } else {
        await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      }
      await page.screenshot({ path: info.outputPath("settings.png"), animations: "disabled" });
    });
  }
}
