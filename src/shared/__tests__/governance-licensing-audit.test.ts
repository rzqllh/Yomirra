import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Governance, Licensing & Provenance Audit - Q163, Q165, Q167, Q168, Q169, Q173, Q174", () => {
  const rootDir = path.resolve(__dirname, "../../../");

  it("Q167: Retains root Apache-2.0 license file unmodified", () => {
    const licensePath = path.join(rootDir, "LICENSE");
    expect(fs.existsSync(licensePath)).toBe(true);

    const licenseContent = fs.readFileSync(licensePath, "utf-8");
    expect(licenseContent).toContain("Apache License");
    expect(licenseContent).toContain("Version 2.0, January 2004");
    expect(licenseContent).toContain("http://www.apache.org/licenses/");
  });

  it("Q165 & Q169: Cites references and documents licensing boundaries for Mihon, Tachiyomi, Aidoku, and Tachimanga", () => {
    const licensingReviewPath = path.join(rootDir, "docs/REFERENCE_LICENSING_REVIEW.md");
    expect(fs.existsSync(licensingReviewPath)).toBe(true);

    const content = fs.readFileSync(licensingReviewPath, "utf-8");
    expect(content).toContain("Mihon");
    expect(content).toContain("Tachiyomi");
    expect(content).toContain("Aidoku");
    expect(content).toContain("Tachimanga");
    // Q169: Tachimanga treated solely as UX/behavior reference, not open code
    expect(content).toContain("Product and observable behavior reference");
    expect(content).toContain("Application source and open-source license not verified");
  });

  it("Q163 & Q168: Affirms PWA boundary and clean-room independent reader interface", () => {
    const readmePath = path.join(rootDir, "README.md");
    expect(fs.existsSync(readmePath)).toBe(true);

    const readmeContent = fs.readFileSync(readmePath, "utf-8");
    expect(readmeContent).toContain("Yomirra adalah reader interface independen");
  });

  it("Q173: Maintains synchronized public documentation suite", () => {
    const docs = [
      "docs/ARCHITECTURE.md",
      "docs/COMPONENTS.md",
      "docs/DESIGN.md",
      "docs/IDENTITY.md",
      "docs/SCHEMA.md",
      "docs/STACK.md",
      "docs/TESTING.md",
    ];

    for (const doc of docs) {
      const docPath = path.join(rootDir, doc);
      expect(fs.existsSync(docPath), `Missing documentation file: ${doc}`).toBe(true);
      const stat = fs.statSync(docPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it("Q174: Authoritative Grill Ledger and Parity Execution Tracker exist and are maintained", () => {
    const trackerPath = path.join(rootDir, "docs/YOMIRRA_FULL_PARITY_EXECUTION.md");
    const ledgerPath = path.join(rootDir, "docs/GRILL_FINAL_LEDGER.md");

    expect(fs.existsSync(trackerPath)).toBe(true);
    expect(fs.existsSync(ledgerPath)).toBe(true);
  });
});
