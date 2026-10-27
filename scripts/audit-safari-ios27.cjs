/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { webkit } = require("@playwright/test");
const path = require("node:path");
const fs = require("node:fs");
const process = require("node:process");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ARTIFACTS_DIR = path.resolve(__dirname, "../artifacts/ios27-safari");
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

const IPHONE_15_PRO = {
  name: "iPhone 15 Pro (Desktop WebKit Mobile Profile)",
  viewport: { width: 393, height: 852 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: "webkit"
};

const IPHONE_15_PRO_LANDSCAPE = {
  name: "iPhone 15 Pro Landscape (Desktop WebKit Mobile Profile)",
  viewport: { width: 852, height: 393 },
  userAgent: IPHONE_15_PRO.userAgent,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: "webkit"
};

async function auditRoute(browser, contextOptions, routePath, name) {
  console.log("\n=== Auditing Route: " + routePath + " (" + name + ") ===");
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yomirra-onboarding", JSON.stringify({ state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0 }));
    } catch (e) {}
  });

  const url = BASE_URL + routePath;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  try {
    await page.waitForSelector("main, header, nav", { timeout: 8000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("Wait timeout, continuing...");
  }

  const metrics = await page.evaluate(() => {
    const testDiv = document.createElement("div");
    testDiv.style.position = "fixed";
    testDiv.style.top = "0";
    testDiv.style.left = "0";
    testDiv.style.width = "10px";
    testDiv.style.height = "10px";
    testDiv.style.paddingTop = "env(safe-area-inset-top, 0px)";
    testDiv.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
    testDiv.style.paddingLeft = "env(safe-area-inset-left, 0px)";
    testDiv.style.paddingRight = "env(safe-area-inset-right, 0px)";
    document.body.appendChild(testDiv);
    const cs = window.getComputedStyle(testDiv);
    const safeArea = {
      top: cs.paddingTop,
      bottom: cs.paddingBottom,
      left: cs.paddingLeft,
      right: cs.paddingRight
    };
    testDiv.remove();

    const vp = window.visualViewport;
    const windowMetrics = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      visualViewport: vp ? {
        width: Math.round(vp.width),
        height: Math.round(vp.height),
        offsetTop: Math.round(vp.offsetTop),
        offsetLeft: Math.round(vp.offsetLeft),
        scale: vp.scale
      } : null,
      displayMode: window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser"
    };

    const header = document.querySelector("header");
    let headerRect = null;
    if (header) {
      const r = header.getBoundingClientRect();
      const hcs = window.getComputedStyle(header);
      headerRect = {
        top: Math.round(r.top),
        height: Math.round(r.height),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
        position: hcs.position,
        paddingTop: hcs.paddingTop,
        paddingBottom: hcs.paddingBottom,
        paddingLeft: hcs.paddingLeft,
        paddingRight: hcs.paddingRight,
        backdropFilter: hcs.backdropFilter || hcs.webkitBackdropFilter || "none"
      };
    }

    const dock = document.querySelector("nav[aria-label=\"Navigasi utama\"]");
    let dockRect = null;
    if (dock) {
      const r = dock.getBoundingClientRect();
      const dcs = window.getComputedStyle(dock);
      dockRect = {
        top: Math.round(r.top),
        height: Math.round(r.height),
        bottom: Math.round(r.bottom),
        position: dcs.position,
        paddingBottom: dcs.paddingBottom,
        paddingLeft: dcs.paddingLeft,
        paddingRight: dcs.paddingRight
      };
    }

    const docEl = document.documentElement;
    const scrollInfo = {
      scrollWidth: docEl.scrollWidth,
      scrollHeight: docEl.scrollHeight,
      hasHorizontalOverflow: docEl.scrollWidth > window.innerWidth
    };

    const meta = {
      viewport: document.querySelector("meta[name=\"viewport\"]")?.getAttribute("content"),
      appleCapable: document.querySelector("meta[name=\"apple-mobile-web-app-capable\"]")?.getAttribute("content"),
      statusBarStyle: document.querySelector("meta[name=\"apple-mobile-web-app-status-bar-style\"]")?.getAttribute("content"),
      themeColor: document.querySelector("meta[name=\"theme-color\"]")?.getAttribute("content")
    };

    return { windowMetrics, safeArea, headerRect, dockRect, scrollInfo, meta };
  });

  console.log("Metrics:", JSON.stringify(metrics, null, 2));
  const screenshotFile = name + ".png";
  const screenshotPath = path.join(ARTIFACTS_DIR, screenshotFile);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log("Saved screenshot: " + screenshotFile);
  await context.close();
  return { name, routePath, metrics, screenshot: screenshotFile };
}

(async () => {
  console.log("=== STARTING REVISED PLAYWRIGHT WEBKIT REAL-SAFARI-LIKE AUDIT ===");
  const browser = await webkit.launch({ headless: true });

  const routes = [
    { path: "/", name: "ios27_safari_home_portrait" },
    { path: "/library", name: "ios27_safari_library_portrait" },
    { path: "/search", name: "ios27_safari_search_portrait" },
    { path: "/popular", name: "ios27_safari_popular_portrait" },
    { path: "/updates", name: "ios27_safari_updates_portrait" },
    { path: "/sources", name: "ios27_safari_sources_portrait" },
    { path: "/account", name: "ios27_safari_account_portrait" },
    { path: "/downloads", name: "ios27_safari_downloads_portrait" },
    { path: "/settings", name: "ios27_safari_settings_portrait" }
  ];

  const results = [];
  for (const r of routes) {
    try {
      const res = await auditRoute(browser, IPHONE_15_PRO, r.path, r.name);
      results.push(res);
    } catch (err) {
      console.error("Failed route " + r.path + ":", err.message);
      results.push({ name: r.name, routePath: r.path, error: err.message });
    }
  }

  // Landscape
  try {
    const resLandscape = await auditRoute(browser, IPHONE_15_PRO_LANDSCAPE, "/", "ios27_safari_home_landscape");
    results.push(resLandscape);
  } catch (err) {
    console.error("Failed landscape:", err.message);
    results.push({ name: "ios27_safari_home_landscape", error: err.message });
  }

  // Audit Search Input Focus & Auto-Zoom Check
  console.log("\n=== Auditing Search Input Focus & iOS Auto-zoom Behavior ===");
  try {
    const ctx = await browser.newContext(IPHONE_15_PRO);
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      try { localStorage.setItem("yomirra-onboarding", JSON.stringify({ state: { hasCompletedOnboarding: true, _hasHydrated: true }, version: 0 })); } catch(e){}
    });
    await page.goto(BASE_URL + "/search", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input", { timeout: 8000 });
    const input = await page.$("input");
    if (input) {
      await input.focus();
      await page.waitForTimeout(500);
      const inputMetrics = await page.evaluate(() => {
        const active = document.activeElement;
        const cs = active ? window.getComputedStyle(active) : null;
        return {
          tagName: active?.tagName,
          fontSize: cs?.fontSize,
          lineHeight: cs?.lineHeight,
          visualViewportScale: window.visualViewport?.scale
        };
      });
      console.log("Search Input Focus Metrics:", JSON.stringify(inputMetrics, null, 2));
      const ssPath = path.join(ARTIFACTS_DIR, "ios27_safari_search_input_focused.png");
      await page.screenshot({ path: ssPath });
      results.push({ name: "ios27_safari_search_input_focused", metrics: inputMetrics, screenshot: "ios27_safari_search_input_focused.png" });
    }
    await ctx.close();
  } catch (err) {
    console.error("Search focus audit error:", err.message);
  }

  await browser.close();
  fs.writeFileSync(path.join(ARTIFACTS_DIR, "audit-results.json"), JSON.stringify(results, null, 2), "utf-8");
  console.log("\n=== Audit Complete. All results and screenshots saved to:", ARTIFACTS_DIR);
})();
