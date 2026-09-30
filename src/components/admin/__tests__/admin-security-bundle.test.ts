import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Admin Client Bundle Security", () => {
  it("does not embed default admin passkey in admin-layout.tsx", () => {
    const filePath = path.resolve(process.cwd(), "src/components/admin/admin-layout.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Must not contain hardcoded default passkeys
    expect(content).not.toContain("yomirra-ops-master-2026");
    expect(content).not.toMatch(/useState\s*\(\s*["']yomirra/i);
    expect(content).not.toMatch(/defaultPasskey\s*=/i);
  });
});
