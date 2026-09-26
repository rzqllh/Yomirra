import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRelativeTime } from "../date";

describe("getRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for missing or invalid dates", () => {
    expect(getRelativeTime()).toBe("");
    expect(getRelativeTime("")).toBe("");
    expect(getRelativeTime("invalid-date")).toBe("");
  });

  it("returns 'Baru saja' for less than 1 minute", () => {
    const date = new Date("2026-09-27T11:59:40.000Z").toISOString();
    expect(getRelativeTime(date)).toBe("Baru saja");
  });

  it("returns 'X mnt lalu' for under 60 minutes", () => {
    const date = new Date("2026-09-27T11:45:00.000Z").toISOString();
    expect(getRelativeTime(date)).toBe("15 mnt lalu");
  });

  it("returns 'X jam lalu' for under 24 hours (consistent 'jam lalu', never 'h')", () => {
    const date1 = new Date("2026-09-27T10:00:00.000Z").toISOString();
    const date2 = new Date("2026-09-27T02:00:00.000Z").toISOString();
    expect(getRelativeTime(date1)).toBe("2 jam lalu");
    expect(getRelativeTime(date2)).toBe("10 jam lalu");
  });

  it("returns 'X hari lalu' for 1 to 7 days", () => {
    const date = new Date("2026-09-24T12:00:00.000Z").toISOString();
    expect(getRelativeTime(date)).toBe("3 hari lalu");
  });

  it("returns short date for more than 7 days", () => {
    const date = new Date("2026-09-10T12:00:00.000Z").toISOString();
    expect(getRelativeTime(date)).toMatch(/10\/9\/2026/);
  });
});
