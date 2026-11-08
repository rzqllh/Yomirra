import { expect, test } from "./fixtures";

const VIEWPORTS = [360, 400, 1440];

for (const width of VIEWPORTS) {
  test(`onboarding responsive fit and CTA visibility at ${width}px across all 3 steps`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });

    // Ensure onboarding state is active (not completed)
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
      localStorage.setItem(
        "yomirra-onboarding",
        JSON.stringify({
          state: { hasCompletedOnboarding: false },
          version: 0,
        })
      );
    });

    await page.goto("/");

    // Wait for OnboardingOverlay dialog to mount
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });

    for (let step = 0; step < 3; step++) {
      // 1. Verify no horizontal overflow on document or dialog
      const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const docClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const dialogScrollWidth = await dialog.evaluate((el) => el.scrollWidth);
      const dialogClientWidth = await dialog.evaluate((el) => el.clientWidth);

      expect(docScrollWidth).toBeLessThanOrEqual(width);
      expect(dialogScrollWidth).toBeLessThanOrEqual(dialogClientWidth);

      // 2. Locate CTA button for current step
      const ctaName = step === 2 ? "Mulai Membaca" : "Lanjut";
      const ctaButton = page.getByRole("button", { name: ctaName });
      await expect(ctaButton).toBeVisible();

      // 3. Measure bounding box and assert containment inside viewport
      const box = (await ctaButton.boundingBox())!;
      expect(box).not.toBeNull();
      const rightEdge = box.x + box.width;

      console.log(
        `[MEASURED] Viewport: ${width}px | Step: ${step + 1} | CTA: "${ctaName}" | x: ${box.x.toFixed(1)}px | width: ${box.width.toFixed(1)}px | rightEdge: ${rightEdge.toFixed(1)}px <= ${width}px | docScrollWidth: ${docScrollWidth}px`
      );

      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(rightEdge).toBeLessThanOrEqual(width);

      // Advance to next step if not on final step
      if (step < 2) {
        await ctaButton.click();
        await page.waitForTimeout(350); // allow motion transition
      }
    }
  });
}
