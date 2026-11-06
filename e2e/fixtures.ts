import { test as base } from "@playwright/test";
import { randomUUID } from "node:crypto";

export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";

export const test = base.extend({
  extraHTTPHeaders: async ({ baseURL, extraHTTPHeaders }, provideHeaders) => {
    const hostname = baseURL && new URL(baseURL).hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "[::1]") {
      await provideHeaders(extraHTTPHeaders);
      return;
    }

    // Separate synthetic browser clients on loopback while the real limiter runs.
    const suffix = randomUUID().split("-").slice(0, 4).join("").match(/.{4}/g)?.join(":");
    await provideHeaders({ ...extraHTTPHeaders, "x-forwarded-for": `2001:db8::${suffix}` });
  },
});
