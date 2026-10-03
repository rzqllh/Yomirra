import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");

describe("catalog navigation restoration contract", () => {
  it("keeps Library and Search pagination in the URL", () => {
    expect(read("src/shared/hooks/use-library-catalog.ts")).toContain(
      "useUrlPagination()"
    );
    expect(read("src/shared/hooks/use-search-catalog.ts")).toContain(
      "useUrlPagination()"
    );
  });

  it("does not force Library to the top on its initial restored render", () => {
    const source = read("src/shared/hooks/use-library-catalog.ts");
    expect(source).toContain("previousPageRef.current === page");
  });
});
