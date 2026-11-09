import { expect, test } from "./fixtures";

const VIEWPORTS = [
  { width: 360, height: 640 }, // compact mobile (e.g. standard Android / small phone)
  { width: 390, height: 844 }, // standard iPhone 14/15
  { width: 400, height: 800 }, // Android baseline
  { width: 1440, height: 900 }, // desktop
];

for (const { width, height } of VIEWPORTS) {
  test(`onboarding responsive fit, CTA visibility and a11y at ${width}x${height}px across all 3 steps`, async ({ page }) => {
    await page.setViewportSize({ width, height });

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

      expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth);
      expect(docScrollWidth).toBeLessThanOrEqual(width);
      expect(dialogScrollWidth).toBeLessThanOrEqual(dialogClientWidth);

      // 2. Locate CTA button for current step
      const ctaName = step === 2 ? "Mulai Membaca" : "Lanjut";
      const ctaButton = page.getByRole("button", { name: ctaName });
      await expect(ctaButton).toBeVisible();

      // 3. Measure bounding box and assert containment inside viewport (both horizontal AND vertical)
      const box = (await ctaButton.boundingBox())!;
      expect(box).not.toBeNull();
      const rightEdge = box.x + box.width;
      const bottomEdge = box.y + box.height;

      // 4. Assert CTA label is not clipped (scrollWidth <= clientWidth)
      const isClipped = await ctaButton.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(isClipped).toBe(false);

      // 5. Assert CTA button is inside viewport (not pushed off screen)
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(rightEdge).toBeLessThanOrEqual(width);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(bottomEdge).toBeLessThanOrEqual(height);

      // 6. On steps > 0, verify Back button accessibility name
      if (step > 0) {
        const backBtn = page.getByRole("button", { name: /kembali/i });
        await expect(backBtn).toBeVisible();
      }

      console.log(
        `[MEASURED] Viewport: ${width}x${height}px | Step: ${step + 1} | CTA: "${ctaName}" | x: ${box.x.toFixed(1)}px | y: ${box.y.toFixed(1)}px | bottom: ${bottomEdge.toFixed(1)}px <= ${height}px`
      );

      // Advance to next step if not on final step
      if (step < 2) {
        await ctaButton.click();
        await page.waitForTimeout(350); // allow motion transition
      }
    }
  });
}
