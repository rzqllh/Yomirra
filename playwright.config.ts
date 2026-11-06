import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "artifacts/ios27-safari/test-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "webkit-mobile-safari",
      use: {
        ...devices["iPhone 15 Pro"],
        defaultBrowserType: "webkit",
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        defaultBrowserType: "chromium",
      },
    },
  ],
  webServer: {
    command: process.env.E2E_PRODUCTION_BUILD === "1" ? "npm run start" : "npm run dev",
    url: "http://localhost:3000/api/health/live",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
