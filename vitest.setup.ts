import { beforeAll } from "vitest";

process.env.IMAGE_PROXY_SECRET = "development-secret-change-in-production-long-string-needed";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.REDIS_URL = "redis://localhost:6379";

beforeAll(() => {
  // Add any global setup here if needed
});
