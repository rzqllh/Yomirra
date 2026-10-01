import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Admin Client Bundle Security", () => {
  it("does not embed or persist privileged admin credentials in admin-layout.tsx", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/admin/admin-layout.tsx",
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toMatch(/useState\s*\(\s*["\']yomirra/i);
    expect(content).not.toMatch(/defaultPasskey\s*=/i);
    expect(content).not.toContain("sessionStorage");
    expect(content).not.toContain("localStorage");
    expect(content).not.toContain("document.cookie");
    expect(content).not.toContain("yomirra_admin_key");
    expect(content).not.toContain("\"x-admin-key\"");
    expect(content).not.toContain("Authorization:");
  });

  it("uses the server session endpoint for unlock and lock", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/admin/admin-layout.tsx",
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/session"');
    expect(content).toContain('method: "POST"');
    expect(content).toContain('method: "DELETE"');
  });
});
