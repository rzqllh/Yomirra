import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock env
vi.mock("@/env", () => ({
  env: {
    GEMINI_API_KEY: "mock-gemini-key",
  },
}));

vi.mock("@/server/lib/security/outbound-policy", () => ({
  safeFetch: vi.fn(),
}));

import { callGeminiGenerateContent, isAIConfigured } from "../ai-provider";
import { generateTitleSummary } from "../ai-text-service";
import { performPageOCR } from "../ocr-service";
import { translateMangaText } from "../translation-service";
import { analyzeMangaPageVision } from "../vision-service";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { env } from "@/env";

describe("AI Services Suite (Phase M, N, O, P)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (env as any).GEMINI_API_KEY = "mock-gemini-key";
  });

  describe("Phase M: AI Provider & Text Generation", () => {
    it("reports AI configured when GEMINI_API_KEY is present", () => {
      expect(isAIConfigured()).toBe(true);
    });

    it("returns AI_UNCONFIGURED if GEMINI_API_KEY is missing", async () => {
      (env as any).GEMINI_API_KEY = undefined;
      const res = await callGeminiGenerateContent([{ text: "hello" }]);
      expect("error" in res).toBe(true);
      if ("error" in res) {
        expect(res.error.code).toBe("AI_UNCONFIGURED");
      }
    });

    it("generates manga title summary successfully", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Kisah petualangan epik seorang pemburu di dunia dungeon." }],
              },
            },
          ],
        }),
      } as any);

      const res = await generateTitleSummary({
        title: "Solo Leveling",
        synopsis: "Sung Jinwoo adalah hunter terlemah...",
        genres: ["Action", "Fantasy"],
        language: "id",
      });

      expect(res.success).toBe(true);
      expect(res.summary).toContain("Kisah petualangan epik");
    });
  });

  describe("Phase N: Page OCR", () => {
    it("fails with MISSING_IMAGE if no base64 or URL is provided", async () => {
      const res = await performPageOCR({});
      expect(res.success).toBe(false);
      expect(res.code).toBe("MISSING_IMAGE");
    });

    it("extracts dialogue lines from base64 image", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Omae wa mou shindeiru.\nNani?!" }],
              },
            },
          ],
        }),
      } as any);

      const res = await performPageOCR({
        imageBase64: "aGVsbG8=", // mock base64
        mimeType: "image/jpeg",
      });

      expect(res.success).toBe(true);
      expect(res.text).toContain("Omae wa mou shindeiru.");
      expect(res.lines?.length).toBe(2);
    });

    it("fetches remote image safely using safeFetch before OCR", async () => {
      vi.mocked(safeFetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/webp" }),
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as any);

      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Dialogue from remote image" }],
              },
            },
          ],
        }),
      } as any);

      const res = await performPageOCR({
        imageUrl: "https://safe-cdn.example/page1.webp",
      });

      expect(safeFetch).toHaveBeenCalledWith("https://safe-cdn.example/page1.webp", expect.any(Object));
      expect(res.success).toBe(true);
      expect(res.text).toBe("Dialogue from remote image");
    });
  });

  describe("Phase O: Translation", () => {
    it("fails with EMPTY_TEXT if text is empty", async () => {
      const res = await translateMangaText({ text: "   " });
      expect(res.success).toBe(false);
      expect(res.code).toBe("EMPTY_TEXT");
    });

    it("translates comic text into Indonesian and preserves originalText", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Kau sudah mati.\nApa?!" }],
              },
            },
          ],
        }),
      } as any);

      const res = await translateMangaText({
        text: "Omae wa mou shindeiru.\nNani?!",
        targetLanguage: "id",
      });

      expect(res.success).toBe(true);
      expect(res.originalText).toBe("Omae wa mou shindeiru.\nNani?!");
      expect(res.translatedText).toBe("Kau sudah mati.\nApa?!");
      expect(res.targetLanguage).toBe("id");
    });
  });

  describe("Phase P: Vision Features", () => {
    it("analyzes manga page layout returning readingDirection and bubbles", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      readingDirection: "rtl",
                      detectedBubblesCount: 4,
                      summary: "Halaman aksi dua panel dengan balon dialog di kanan atas.",
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const res = await analyzeMangaPageVision({
        imageBase64: "aGVsbG8=",
      });

      expect(res.success).toBe(true);
      expect(res.readingDirection).toBe("rtl");
      expect(res.detectedBubblesCount).toBe(4);
      expect(res.summary).toContain("Halaman aksi");
    });
  });
});
