import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/komik/card/manga-card.tsx"),
  "utf-8"
);

describe("manga card partial-data contract", () => {
  it("does not invent status or opaque rating placeholders", () => {
    expect(source).not.toContain('manga.status || "Ongoing"');
    expect(source).not.toContain('"-.-"');
  });

  it("keeps explicit reader-facing fallbacks for optional metadata", () => {
    expect(source).toContain("Sinopsis belum tersedia");
    expect(source).toContain("Chapter belum tersedia");
    expect(source).toContain('data-card-slot="synopsis"');
    expect(source).toContain('data-card-slot="badges"');
  });

  it("keeps combined Popular source selection source-correct", () => {
    expect(source).toContain('aria-haspopup={isMultiSource ? "dialog" : undefined}');
    expect(source).toContain("setIsSourceDialogOpen(true)");
    expect(source).toContain("sourceBindings={availableBindings}");
  });
});
