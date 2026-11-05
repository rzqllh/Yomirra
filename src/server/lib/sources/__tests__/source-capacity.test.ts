import { describe, expect, it } from "vitest";
import { withSourceCapacity } from "../source-capacity";

describe("source capacity", () => {
  it("rejects excess work, isolates other sources, and frees failed slots", async () => {
    const pending = Promise.withResolvers<never>();
    const active = Array.from({ length: 8 }, () =>
      withSourceCapacity("busy", () => pending.promise).catch(() => null)
    );

    await expect(withSourceCapacity("busy", async () => 1)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      statusCode: 429,
    });
    await expect(withSourceCapacity("other", async () => 2)).resolves.toBe(2);

    pending.reject(new Error("upstream failed"));
    await Promise.all(active);
    await expect(withSourceCapacity("busy", async () => 3)).resolves.toBe(3);
  });
});
