import { expect, test } from "@playwright/test";
import {
  EXPLICIT_DOWNLOADS_CACHE_NAME,
  PAGES_CACHE_NAME,
  SAFE_OFFLINE_PAGE_HEADER,
  SAFE_OFFLINE_PAGE_SCOPE,
} from "../src/shared/lib/pwa-cache-policy";
import { CONTENT_PREFERENCE_COOKIE } from "../src/shared/sources/content-policy";

test("offline cache retains downloads and only stores safe documents", async ({ context, page, baseURL }) => {
  test.skip(process.env.E2E_PRODUCTION_BUILD !== "1", "Requires a production service worker build");

  await page.goto("/api/health/live");
  const offlineImage = "/offline-images/regression/1";
  await page.evaluate(async ({ offlineImage, downloads }) => {
    const cache = await caches.open(downloads);
    await cache.put(offlineImage, new Response("explicit-download"));
    const legacy = await caches.open("pages-rsc");
    await legacy.put("/settings", new Response("legacy-cookie-dependent-payload"));
  }, { offlineImage, downloads: EXPLICIT_DOWNLOADS_CACHE_NAME });

  await page.goto("/settings");
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const safe = await page.reload();
  expect(safe?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBe(SAFE_OFFLINE_PAGE_SCOPE);
  await expect.poll(() => page.evaluate(async (name) => {
    const cache = await caches.open(name);
    return (await cache.match("/settings"))?.headers.get("x-yomirra-offline-cache");
  }, PAGES_CACHE_NAME)).toBe(SAFE_OFFLINE_PAGE_SCOPE);
  await expect.poll(() => page.evaluate(() => caches.has("pages-rsc"))).toBe(false);

  await context.addCookies([{ name: CONTENT_PREFERENCE_COOKIE, value: "false", url: baseURL! }]);
  const optedIn = await page.goto("/settings?cache-check=opted-in");
  expect(optedIn?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBeUndefined();
  expect(await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    return Boolean(await cache.match("/settings?cache-check=opted-in"));
  }, PAGES_CACHE_NAME)).toBe(false);

  await context.setOffline(true);
  expect(await page.evaluate(async (url) => (await fetch(url)).text(), offlineImage)).toBe("explicit-download");
  expect(await page.evaluate(async () => fetch("/api/health/live").then(() => false, () => true))).toBe(true);
  const cached = await page.goto("/settings");
  expect(cached?.headers()[SAFE_OFFLINE_PAGE_HEADER]).toBe(SAFE_OFFLINE_PAGE_SCOPE);
});
