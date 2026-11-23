import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/auth/admin-auth", () => ({
  ADULT_SESSION_COOKIE: "yomirra_adult_session",
  verifyVerifiedAdultSession: vi.fn(async (v: string | undefined) => v === "signed-session"),
}));

import { getVerifiedRequestReadOptions } from "@/server/lib/sources/content-access";

describe("signed adult-access boundary", () => {
  const request = (cookie = "", query = "") => new NextRequest(
    "https://example.test/api/sources" + query, { headers: { cookie } }
  );
  it("denies guests even when they modify the opt-in cookie", async () => {
    expect((await getVerifiedRequestReadOptions(request("yomirra-hide-nsfw=false"))).hideNsfw).toBe(true);
  });
  it("requires both opt-in and an age-verified signed session", async () => {
    expect((await getVerifiedRequestReadOptions(request(
      "yomirra-hide-nsfw=false; yomirra_adult_session=signed-session"
    ))).hideNsfw).toBe(false);
    expect((await getVerifiedRequestReadOptions(request(
      "yomirra-hide-nsfw=true; yomirra_adult_session=signed-session"
    ))).hideNsfw).toBe(true);
    expect((await getVerifiedRequestReadOptions(request(
      "yomirra-hide-nsfw=false; yomirra_adult_session=signed-session", "?hideNsfw=true"
    ))).hideNsfw).toBe(true);
  });
});
