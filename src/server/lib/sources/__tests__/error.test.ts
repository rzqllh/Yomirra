import { describe, it, expect } from "vitest";
import { SourceError, getFriendlyErrorMessage } from "../error";

describe("SourceError and Error Normalization", () => {
  it("classifies rate limiting errors correctly", () => {
    const err429 = { statusCode: 429, message: "Too many requests" };
    const classified = SourceError.classify(err429, "mangadex", "search");

    expect(classified.code).toBe("RATE_LIMITED");
    expect(classified.sourceId).toBe("mangadex");
    expect(classified.stage).toBe("search");
    expect(getFriendlyErrorMessage(classified.code)).toBe("mencapai batas permintaan (rate limited)");
  });

  it("classifies Cloudflare and 403 blocks correctly", () => {
    const cfErr = new Error("Cloudflare challenge page presented (HTTP 403)");
    const classified = SourceError.classify(cfErr, "shinigami", "transport");

    expect(classified.code).toBe("UPSTREAM_BLOCKED");
    expect(getFriendlyErrorMessage(classified.code)).toBe("diblokir perlindungan situs (Cloudflare)");
  });

  it("classifies 404 on search as ROUTE_CHANGED", () => {
    const routeErr = { statusCode: 404, message: "Not Found: /manga/page/1/" };
    const classified = SourceError.classify(routeErr, "komikindo", "search");

    expect(classified.code).toBe("ROUTE_CHANGED");
    expect(getFriendlyErrorMessage(classified.code)).toBe("perubahan struktur alamat URL pada sumber");
  });

  it("classifies timeouts correctly", () => {
    const timeoutErr = new Error("The operation was aborted due to timeout");
    const classified = SourceError.classify(timeoutErr, "komiku", "search");

    expect(classified.code).toBe("UPSTREAM_TIMEOUT");
    expect(getFriendlyErrorMessage(classified.code)).toBe("tidak dapat dijangkau (koneksi lambat/timeout)");
  });

  it("classifies connection and DNS failures as SOURCE_DOWN", () => {
    const connErr = new Error("fetch failed: ECONNREFUSED");
    const classified = SourceError.classify(connErr, "asurascans", "transport");

    expect(classified.code).toBe("SOURCE_DOWN");
    expect(getFriendlyErrorMessage(classified.code)).toBe("server sumber sedang tidak dapat dihubungi");
  });

  it("classifies decryption failures correctly", () => {
    const decryptErr = new Error("Decryption cipher error: invalid padding / bad key");
    const classified = SourceError.classify(decryptErr, "komiknesia", "detail");

    expect(classified.code).toBe("DECRYPT_FAILURE");
    expect(getFriendlyErrorMessage(classified.code)).toBe("gagal mendekripsi respon data dari sumber");
  });

  it("classifies cheerio and empty parse results as PARSER_BROKEN", () => {
    const parserErr = new Error("cheerio empty unexpected parse: no animepost matched");
    const classified = SourceError.classify(parserErr, "komikindo", "search");

    expect(classified.code).toBe("PARSER_BROKEN");
    expect(getFriendlyErrorMessage(classified.code)).toBe("sedang bermasalah (perubahan struktur situs)");
  });

  it("classifies schema mismatches as SCHEMA_CHANGED", () => {
    const schemaErr = new Error("Zod validation failed: cannot read properties of undefined");
    const classified = SourceError.classify(schemaErr, "komiku-ii", "chapters");

    expect(classified.code).toBe("SCHEMA_CHANGED");
    expect(getFriendlyErrorMessage(classified.code)).toBe("format data sumber telah berubah");
  });

  it("passes through existing SourceError without double-wrapping", () => {
    const original = new SourceError("Custom message", {
      code: "DECRYPT_FAILURE",
      sourceId: "komiknesia",
      stage: "detail",
    });

    const reclassified = SourceError.classify(original, "komiknesia");
    expect(reclassified).toBe(original);
  });
});
