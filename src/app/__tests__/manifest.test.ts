import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";
import fs from "fs";
import path from "path";

function getPngDimensions(relativePath: string) {
  const fullPath = path.join(process.cwd(), "public", relativePath.replace(/^\//, "").replace(/^public\//, ""));
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${fullPath}`);
  }
  const buf = fs.readFileSync(fullPath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

describe("F10: PWA Manifest & Asset Alignment", () => {
  it("provides valid web application manifest metadata", () => {
    const data = manifest();
    expect(data.name).toBe("Yomirra");
    expect(data.start_url).toBe("/");
    expect(data.display).toBe("fullscreen");
    expect(data.icons).toHaveLength(4);
    expect(data.shortcuts).toHaveLength(4);
    expect(data.shortcuts?.[0]?.url).toBe("/bookmark");
    expect(data.screenshots).toHaveLength(3);
  });

  it("declares screenshot dimensions that match actual image files", () => {
    const data = manifest();
    for (const screenshot of data.screenshots || []) {
      const { width, height } = getPngDimensions(screenshot.src);
      expect(screenshot.sizes).toBe(`${width}x${height}`);
    }
  });

  it("references icon assets that exist on disk", () => {
    const data = manifest();
    for (const icon of data.icons || []) {
      const fullPath = path.join(process.cwd(), "public", icon.src.replace(/^\//, ""));
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});
