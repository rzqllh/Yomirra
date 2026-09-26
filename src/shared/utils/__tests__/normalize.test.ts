import { describe, it, expect } from "vitest";
import { stripHtml, normalizeTitle, parseDate } from "../normalize";

describe("Utils: normalize", () => {
  describe("stripHtml", () => {
    it("should remove HTML tags", () => {
      expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
    });
    it("should handle empty strings", () => {
      expect(stripHtml("")).toBe("");
    });
    it("should unescape raw markdown bracket notation (e.g., \\[MENARA UJIAN\\])", () => {
      expect(stripHtml("Setelah menyelesaikan \\[MENARA UJIAN\\], sang pahlawan...")).toBe(
        "Setelah menyelesaikan [MENARA UJIAN], sang pahlawan..."
      );
    });
    it("should unescape escaped markdown formatting characters", () => {
      expect(stripHtml("Fitur \\*spesial\\* dan \\_kemampuan\\_ unik")).toBe(
        "Fitur *spesial* dan _kemampuan_ unik"
      );
    });
    it("should decode common HTML entities", () => {
      expect(stripHtml("Hero &amp; Villain &quot;Story&#039;s&quot; &lt;Legend&gt;")).toBe(
        "Hero & Villain \"Story's\" <Legend>"
      );
    });
  });

  describe("normalizeTitle", () => {
    it("should collapse multiple spaces", () => {
      expect(normalizeTitle("Manga   Title  With   Spaces")).toBe("Manga Title With Spaces");
    });
    it("should trim start and end", () => {
      expect(normalizeTitle("  Clean Title  ")).toBe("Clean Title");
    });
  });

  describe("parseDate", () => {
    it("should parse standard ISO dates", () => {
      const dateStr = "2023-10-25T14:00:00Z";
      expect(parseDate(dateStr)).toBe("2023-10-25T14:00:00.000Z");
    });
    it("should handle relative times like '2 days ago'", () => {
      const parsed = parseDate("2 days ago");
      const diff = Date.now() - new Date(parsed).getTime();
      // Should be roughly 48 hours
      expect(diff).toBeGreaterThan(47 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(49 * 60 * 60 * 1000);
    });
  });
});
