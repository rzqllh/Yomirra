import { beforeAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";

process.env.IMAGE_PROXY_SECRET = "development-secret-change-in-production-long-string-needed";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.REDIS_URL = "redis://localhost:6379";

MotionGlobalConfig.skipAnimations = true;

beforeAll(() => {
  // Add any global setup here if needed
});

afterEach(() => {
  cleanup();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});
