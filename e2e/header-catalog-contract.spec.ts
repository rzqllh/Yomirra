import { test, expect, type Page } from "./fixtures";

const mobileEdge = 767;
const desktopEdge = 768;

function topNav(page: Page) {
  return page.locator("header").filter({
    has: page.getByRole("navigation", { name: "Breadcrumb", exact: true, includeHidden: true }),
  });
}

async function openRoute(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0, { timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("yomirra-onboarding", JSON.stringify({
      state: { hasCompletedOnboarding: true },
      version: 0,
    }));
  });
});

for (const { path, title } of [
  { path: "/", title: /Mau baca apa hari ini\?/i },
  { path: "/search", title: "Cari" },
  { path: "/downloads", title: "Unduhan" },
  { path: "/account", title: "Akun & Sinkronisasi" },
  { path: "/help", title: "Ada yang tidak berjalan semestinya?" },
]) {
  test(`${path} has one accessible H1 and main across md`, async ({ page }) => {
    await page.setViewportSize({ width: mobileEdge, height: 640 });
    await openRoute(page, path);

    for (const width of [mobileEdge, desktopEdge]) {
      await page.setViewportSize({ width, height: 640 });
      const main = page.getByRole("main");
      await expect(main).toHaveCount(1);
      await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(main.getByRole("heading", { level: 1, name: title, exact: true })).toHaveCount(1);

      if (width === mobileEdge) {
        await expect(topNav(page)).toBeHidden();
      } else {
        await expect(topNav(page)).toBeVisible();
        await expect(main.locator("header:visible")).toHaveCount(0);
      }
    }
  });
}

test("desktop search follows the active route and the Home hero", async ({ page }) => {
  await page.setViewportSize({ width: desktopEdge, height: 500 });
  await openRoute(page, "/");
  const pill = topNav(page).getByRole("button", { name: "Cari komik…", exact: true });
  const hero = page.locator("#home-hero-search");
  await expect(hero).toBeVisible();
  await expect(pill).toHaveCount(0);

  await hero.evaluate((node) => {
    window.scrollTo(0, window.scrollY + node.getBoundingClientRect().bottom);
  });
  await expect(pill).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(pill).toHaveCount(0);

  const rail = page.getByRole("navigation", { name: "Navigasi desktop" });
  await rail.getByRole("link", { name: "Jelajah", exact: true }).click();
  await expect(page).toHaveURL(/\/library(?:\?|$)/);
  await expect(pill).toBeEnabled();
  await pill.focus();
  await pill.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Quick Search", exact: true });
  await expect(dialog.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(pill).toBeFocused();

  await rail.getByRole("link", { name: "Cari", exact: true }).click();
  await expect(page).toHaveURL(/\/search(?:\?|$)/);
  await expect(pill).toHaveCount(0);
});

test("desktop Home search follows the TopNav boundary when an announcement is dismissed", async ({ page }) => {
  await page.setViewportSize({ width: desktopEdge, height: 500 });
  let showAnnouncement = () => {};
  const announcementReady = new Promise<void>((resolve) => { showAnnouncement = resolve; });
  await page.route("**/api/site/config", async (route) => {
    await announcementReady;
    await route.fulfill({
      json: { announcement: { id: "hc-11", enabled: true, type: "info", message: "Pengumuman pengujian" } },
    });
  });

  const nav = topNav(page);
  const hero = page.locator("#home-hero-search");
  const pill = nav.getByRole("button", { name: "Cari komik…", exact: true });
  const banner = page.getByRole("complementary", { name: "Pengumuman Situs" });
  const navBottom = () => nav.evaluate((node) => node.getBoundingClientRect().bottom);
  const placeHeroBottom = async (target: number) => {
    await expect.poll(() => hero.evaluate((node, expectedBottom) => {
      const distance = node.getBoundingClientRect().bottom - expectedBottom;
      if (Math.abs(distance) >= 2) window.scrollBy({ top: distance, behavior: "instant" });
      return Math.abs(distance);
    }, target)).toBeLessThan(2);
  };

  let unshiftedBottom: number;
  try {
    await openRoute(page, "/");
    await expect(hero).toBeVisible();
    unshiftedBottom = await navBottom();
  } finally {
    showAnnouncement();
  }

  await expect(banner).toBeVisible();
  await expect.poll(async () => {
    const bannerBottom = await banner.evaluate((node) => node.getBoundingClientRect().bottom);
    const navTop = await nav.evaluate((node) => node.getBoundingClientRect().top);
    return Math.abs(navTop - bannerBottom);
  }).toBeLessThan(1);
  const announcedBottom = await navBottom();
  expect(announcedBottom - unshiftedBottom).toBeGreaterThan(8);

  const midpoint = (announcedBottom + unshiftedBottom) / 2;
  await placeHeroBottom(midpoint);
  await expect(pill).toBeVisible();

  await banner.getByRole("button", { name: "Tutup pengumuman" }).click();
  await expect(banner).toHaveCount(0);
  await expect.poll(navBottom).toBeCloseTo(unshiftedBottom, 0);
  await placeHeroBottom(midpoint);
  await expect(pill).toHaveCount(0);

  await placeHeroBottom(unshiftedBottom - 8);
  await expect(pill).toBeVisible();
});

test("desktop account shows the parent breadcrumb and in-page back control", async ({ page }) => {
  await page.setViewportSize({ width: desktopEdge, height: 640 });
  await openRoute(page, "/settings");
  await page.getByRole("main").locator('a[href="/account"]').first().click();
  await expect(page).toHaveURL(/\/account(?:\?|$)/);
  await expect(topNav(page).getByRole("link", { name: "Pengaturan", exact: true })).toHaveAttribute("href", "/settings");
  const back = page.getByRole("main").getByRole("button", { name: "Kembali", exact: true });
  await expect(back).toHaveCount(1);
  await back.focus();
  await back.press("Enter");
  await expect(page).toHaveURL(/\/settings(?:\?|$)/);
});

test("Downloads keeps its mobile action and supports desktop keyboard tabs and confirmation", async ({ page }) => {
  await page.setViewportSize({ width: mobileEdge, height: 640 });
  await page.addInitScript(() => {
    const id = "komiku::fixture-komik::chapter-1";
    localStorage.setItem("yomirra-downloads", JSON.stringify({
      state: {
        downloads: {
          [id]: {
            id, sourceId: "komiku", mangaId: "fixture-komik", mangaTitle: "Komik Fixture",
            chapterId: "chapter-1", chapterTitle: "Chapter 1", status: "downloaded",
            progress: 100, totalPages: 1, downloadedPages: 1, pages: [], createdAt: 1, updatedAt: 1,
          },
        },
      },
      version: 0,
    }));
  });
  await openRoute(page, "/downloads");

  const clear = page.getByRole("button", { name: "Hapus Semua", exact: true });
  const main = page.getByRole("main");
  await expect(main.locator("header").getByRole("button", { name: "Hapus Semua", exact: true })).toBeVisible();
  await expect(main.locator("header").getByRole("button", { name: "Buka menu akun" })).toHaveCount(0);

  await page.setViewportSize({ width: desktopEdge, height: 640 });
  await expect(clear).toHaveCount(1);
  await expect(page.locator('[data-content-lane="focused"]').getByRole("button", { name: "Hapus Semua", exact: true })).toBeVisible();

  const tabs = page.getByRole("tablist", { name: "Status unduhan" });
  const completed = tabs.getByRole("tab", { name: "Selesai (1)", exact: true });
  const queued = tabs.getByRole("tab", { name: "Antrean (0)", exact: true });
  await expect(completed).toHaveAttribute("aria-selected", "true");
  await completed.focus();
  await completed.press("ArrowLeft");
  await expect(queued).toBeFocused();
  await expect(queued).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Antrean (0)" })).toBeVisible();
  await queued.press("ArrowRight");
  await expect(completed).toBeFocused();
  await expect(completed).toHaveAttribute("aria-selected", "true");

  const confirmation = page.waitForEvent("dialog").then(async dialog => {
    const type = dialog.type();
    await dialog.dismiss();
    return type;
  });
  await clear.press("Enter");
  expect(await confirmation).toBe("confirm");
  await expect(completed).toBeVisible();

  const accepted = page.waitForEvent("dialog").then(async (dialog) => {
    await dialog.accept();
  });
  await clear.press("Enter");
  await accepted;
  await expect(page.getByText("Belum ada unduhan", { exact: true })).toBeVisible();
  await expect(clear).toHaveCount(0);
});

test("Settings backup has one heading and restores focus across md", async ({ page }) => {
  await page.setViewportSize({ width: mobileEdge, height: 640 });
  await openRoute(page, "/settings");
  const main = page.getByRole("main");
  const trigger = main.getByRole("button", { name: "Kelola cadangan", exact: true });
  const back = main.getByRole("button", { name: "Kembali ke pengaturan", exact: true });

  for (const width of [mobileEdge, desktopEdge]) {
    await page.setViewportSize({ width, height: 640 });
    await trigger.press("Enter");
    await expect(back).toBeFocused();
    await expect(main.getByRole("heading", { name: "Cadangan data", exact: true })).toHaveCount(1);
    await expect(main.getByRole("heading", { level: 1, name: "Cadangan data", exact: true })).toHaveCount(1);
    if (width === mobileEdge) {
      await expect(main.locator("header").getByRole("button", { name: "Buka menu akun" })).toHaveCount(0);
    }
    await back.press("Enter");
    await expect(trigger).toBeFocused();
  }
});
