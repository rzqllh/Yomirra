import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

describe("security surface contracts", () => {
  it("keeps CSP in report-only mode with the required baseline directives", () => {
    const config = readRepoFile("next.config.ts");

    expect(config).toContain('"Content-Security-Policy-Report-Only"');
    expect(config).toContain('"default-src \'self\'"');
    expect(config).toContain('"object-src \'none\'"');
    expect(config).toContain('"frame-ancestors \'none\'"');
    expect(config).toContain('"connect-src \'self\' https: wss:"');
    expect(config).toContain('"worker-src \'self\' blob:"');
    expect(config).toContain("https://accounts.google.com");
    expect(config).toContain("https://*.firebaseapp.com");
    expect(config).toContain("https://*.web.app");
  });

  it("does not render raw generic client error messages", () => {
    const boundary = readRepoFile("src/components/ui/error-boundary.tsx");
    const sourcePage = readRepoFile("src/app/(web)/sources/[sourceId]/page.tsx");
    const mangaError = readRepoFile(
      "src/components/komik/manga-detail-error-state.tsx"
    );
    const globalError = readRepoFile("src/app/(web)/error.tsx");

    expect(boundary).not.toContain("this.state.error?.message");
    expect(sourcePage).not.toContain("(error as Error).message");
    expect(mangaError).not.toContain("isRawSystemError");
    expect(globalError).toContain("digest: error.digest ?? null");
    expect(globalError).not.toContain('console.error("Global Error Caught:", error)');
  });

  it("keeps generic admin API failures server-side", () => {
    const customSourceRoute = readRepoFile(
      "src/app/api/admin/sources/custom/route.ts"
    );
    const customSourceTestRoute = readRepoFile(
      "src/app/api/admin/sources/custom/test/route.ts"
    );

    expect(customSourceRoute).not.toContain(
      "error instanceof Error ? error.message"
    );
    expect(customSourceTestRoute).not.toContain(
      "error instanceof Error ? error.message"
    );
  });
});
