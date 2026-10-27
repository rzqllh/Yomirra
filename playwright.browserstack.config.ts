import { defineConfig } from "@playwright/test";

/**
 * BrowserStack Automate configuration for Real iOS Safari (iOS 27 target).
 * Follows official BrowserStack Node.js Playwright iOS specification:
 * https://www.browserstack.com/docs/automate/playwright/playwright-ios/nodejs
 */

const BS_USERNAME = process.env.BROWSERSTACK_USERNAME || "";
const BS_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY || "";
const IS_CONFIGURED = Boolean(BS_USERNAME && BS_ACCESS_KEY);

const caps = {
  "browserstack.username": BS_USERNAME,
  "browserstack.accessKey": BS_ACCESS_KEY,
  browser: "safari",
  device: "iPhone 16 Pro",
  os_version: "27",
  realMobile: true,
  "browserstack.local": true,
  build: "yomirra-ios27-safari-qa",
  name: "Yomirra iOS 27 Real Safari QA",
};

const cdpUrl = IS_CONFIGURED
  ? `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`
  : "";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
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
      name: "browserstack-ios27-real-safari",
      use: {
        browserName: "webkit",
      },
    },
  ],
});
