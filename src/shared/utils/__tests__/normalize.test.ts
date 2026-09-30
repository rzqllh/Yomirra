import { describe, it, expect } from "vitest";
import { stripHtml, normalizeSynopsis, normalizeTitle, parseDate } from "../normalize";

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
    it("should clean detail synopsis with mixed HTML, entities, and escaped markdown brackets", () => {
      const rawSynopsis = "<p>Setelah menyelesaikan \\[MENARA UJIAN\\], sang pahlawan kembali &amp; mendapati dunia &quot;berbeda&quot;.<br/>Musuh baru bermunculan.</p>";
      expect(stripHtml(rawSynopsis)).toBe(
        "Setelah menyelesaikan [MENARA UJIAN], sang pahlawan kembali & mendapati dunia \"berbeda\". Musuh baru bermunculan."
      );
    });
    it("should strip entity-encoded HTML tags before rendering", () => {
      expect(stripHtml("&lt;p&gt;&lt;strong&gt;Sinopsis:&lt;/strong&gt;&lt;br /&gt;Cerita utama.&lt;/p&gt;")).toBe(
        "Sinopsis: Cerita utama."
      );
    });

    it("should handle double-encoded provider markup", () => {
      expect(stripHtml("&amp;lt;p&amp;gt;Cerita &amp;amp; konflik.&amp;lt;/p&amp;gt;")).toBe(
        "Cerita & konflik."
      );
    });
    it("should strip entity-encoded tags that contain encoded attributes", () => {
      expect(
        stripHtml(
          '&lt;a href=&quot;https://example.com/file&quot; target=&quot;_blank&quot;&gt;Chapter 01-10&lt;/a&gt;'
        )
      ).toBe("Chapter 01-10");
    });
  });

  describe("normalizeSynopsis", () => {
    it("removes provider synopsis labels and download-batch boilerplate", () => {
      const raw =
        "&lt;p&gt;&lt;strong&gt;Sinopsis:&lt;/strong&gt;&lt;br /&gt;Cerita utama yang harus tampil.&lt;/p&gt;" +
        "&lt;p&gt;&lt;strong&gt;Download Batch&lt;/strong&gt; Chapter 01-10 Chapter 11-20&lt;/p&gt;";

      expect(normalizeSynopsis(raw)).toBe("Cerita utama yang harus tampil.");
    });

    it("converts markdown links into readable synopsis text", () => {
      expect(normalizeSynopsis("Baca [cerita utama](https://example.com) **sekarang**.")).toBe(
        "Baca cerita utama sekarang."
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
