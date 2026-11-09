import { expect, test } from "./fixtures";

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 667, height: 375 },
  { width: 360, height: 640 }, // compact mobile (e.g. standard Android / small phone)
  { width: 390, height: 844 }, // standard iPhone 14/15
  { width: 400, height: 800 }, // Android baseline
  { width: 1440, height: 900 }, // desktop
];

for (const { width, height } of VIEWPORTS) {
  test(`onboarding responsive fit, CTA visibility and a11y at ${width}x${height}px across all 3 steps`, async ({ page }, testInfo) => {
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

    // Help mounts the same global overlay without depending on provider feeds.
    await page.goto("/help", { waitUntil: "domcontentloaded" });

    // Wait for OnboardingOverlay dialog to mount
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, { prompt: async () => undefined, userChoice: Promise.resolve({ outcome: "dismissed" }) });
      window.dispatchEvent(event);
    });

    for (let step = 0; step < 3; step++) {
      // 1. Verify no horizontal overflow on document or dialog
      const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const docClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const dialogScrollWidth = await dialog.evaluate((el) => el.scrollWidth);
      const dialogClientWidth = await dialog.evaluate((el) => el.clientWidth);

      expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth);
      expect(docScrollWidth).toBeLessThanOrEqual(width);
      expect(dialogScrollWidth).toBeLessThanOrEqual(dialogClientWidth);
      const overflow = await dialog.locator("main").evaluate(el => el.scrollHeight - el.clientHeight);
      expect(overflow, "ordinary text must fit without scrolling").toBeLessThanOrEqual(1);
      if (step === 2) {
        await expect(dialog.getByRole("button", { name: "Pasang", exact: true })).toBeVisible();
        if (/iPhone|iPad/.test(await page.evaluate(() => navigator.userAgent))) {
          await dialog.getByRole("button", { name: "Pasang", exact: true }).click();
          const guide = page.getByRole("dialog", { name: "Pasang di iPhone / iPad" });
          await expect(guide).toBeVisible();
          // A visible but covered guide would fail this ordinary click.
          await guide.getByRole("button", { name: "Mengerti" }).click();
          await expect(guide).toBeHidden();
          await expect(page.getByRole("button", { name: "Mulai Membaca" })).toBeVisible();
        }
      }

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

      await page.screenshot({ path: testInfo.outputPath(`step-${step + 1}.png`) });
      // Advance to next step if not on final step
      if (step < 2) {
        await ctaButton.click();
        await page.waitForTimeout(350); // allow motion transition
      }
    }
  });
}

test("installation guide stays above onboarding and Escape returns to the final step", async ({ browser, baseURL, extraHTTPHeaders }) => {
  const context = await browser.newContext({
    baseURL, extraHTTPHeaders, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Langkah 3" }).click({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Langkah 3" })).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: "Pasang", exact: true }).click();
    const guide = page.getByRole("dialog", { name: "Pasang di iPhone / iPad" });
    await expect(guide).toBeVisible();
    await guide.getByRole("button", { name: "Mengerti" }).click();
    await expect(guide).toBeHidden();
    await page.getByRole("button", { name: "Pasang", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(guide).toBeHidden();
    await expect(page.getByRole("button", { name: "Pasang", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Mulai Membaca" })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("desktop keyboard hint follows pointer capability and enlarged text keeps actions reachable", async ({ browser, baseURL, extraHTTPHeaders }) => {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders, viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Gunakan tombol panah keyboard/)).toBeVisible();
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    const next = page.getByRole("button", { name: "Lanjut", exact: true });
    await expect(next).toBeInViewport();
    await next.click();
    await expect(page.getByRole("button", { name: "Kembali ke langkah sebelumnya" })).toBeInViewport();
  } finally {
    await context.close();
  }
});
