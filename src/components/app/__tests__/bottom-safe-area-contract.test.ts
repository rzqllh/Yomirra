import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");

describe("mobile bottom safe-area ownership", () => {
  it("keeps dock reservation in AppShell rather than stacking it in PageContainer", () => {
    const shell = read("src/components/chrome/app-shell.tsx");
    const container = read("src/components/ui/page-container.tsx");

    expect(shell).toContain('pb-[var(--page-bottom-safe)] md:pb-0');
    expect(container).toContain("px-4 pb-0");
    expect(container).not.toContain("px-4 pb-12");
  });

  it("does not add another fixed bottom reservation on Home feed content", () => {
    const home = read("src/components/home/home-feed-client.tsx");
    expect(home).not.toContain('className="pb-16"');
  });
});
