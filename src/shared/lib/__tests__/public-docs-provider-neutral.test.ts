import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_DOCS = ["README.md", "CHANGELOG.md"] as const;

const CONTENT_SOURCE_NAMES = [
  "shinigami",
  "komikindo",
  "mangadex",
  "komiku",
  "komiku ii",
  "asura scans",
  "komiknesia",
  "doujindesu",
] as const;

describe("public documentation provider-neutrality", () => {
  it.each(PUBLIC_DOCS)("%s does not expose content-source provider names", (file) => {
    const content = fs
      .readFileSync(path.resolve(process.cwd(), file), "utf-8")
      .toLowerCase();

    for (const providerName of CONTENT_SOURCE_NAMES) {
      expect(content).not.toContain(providerName);
    }
  });
});
