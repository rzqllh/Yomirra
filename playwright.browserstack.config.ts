import { defineConfig } from "@playwright/test";

/**
 * BrowserStack Automate configuration for Real iOS Safari.
 * Adheres strictly to the official BrowserStack Playwright iOS specification (W3C bstack:options):
 * https://www.browserstack.com/docs/automate/playwright/playwright-ios/nodejs
 */

const BS_USERNAME = process.env.BROWSERSTACK_USERNAME || "";
const BS_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY || "";
const IS_CONFIGURED = Boolean(BS_USERNAME && BS_ACCESS_KEY);

// Official W3C capability structure for BrowserStack Playwright iOS Real Devices
const caps = {
  browser: "safari",
  "bstack:options": {
    osVersion: process.env.BROWSERSTACK_OS_VERSION || "17",
    deviceName: process.env.BROWSERSTACK_DEVICE || "iPhone 15 Pro",
    realMobile: "true",
    userName: BS_USERNAME,
    accessKey: BS_ACCESS_KEY,
    projectName: "Yomirra",
    buildName: process.env.BROWSERSTACK_BUILD_NAME || "yomirra-ios-safari-qa",
    sessionName: process.env.BROWSERSTACK_SESSION_NAME || "Yomirra iOS Real Safari QA",
    local: process.env.BROWSERSTACK_LOCAL === "true",
    ...(process.env.BROWSERSTACK_LOCAL_IDENTIFIER
      ? { localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER }
      : {}),
  },
};

const cdpUrl = IS_CONFIGURED
  ? `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`
  : "";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    ...(IS_CONFIGURED
      ? {
          connectOptions: {
            wsEndpoint: cdpUrl,
          },
        }
      : {}),
  },
  projects: [
    {
      name: "browserstack-ios-real-safari",
      use: {
        browserName: "webkit",
      },
    },
  ],
});
