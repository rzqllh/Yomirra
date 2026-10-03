import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/security/rate-limit", () => ({
  checkRateLimitPolicy: vi.fn().mockResolvedValue({ success: true, headers: {} }),
  createRateLimitRejection: vi.fn(() => new Response(JSON.stringify({ error: "Rate limit" }), { status: 429 })),
}));

vi.mock("@/server/lib/ai/ai-text-service", () => ({
  generateTitleSummary: vi.fn(),
}));

vi.mock("@/server/lib/ai/ocr-service", () => ({
  performPageOCR: vi.fn(),
}));

vi.mock("@/server/lib/ai/translation-service", () => ({
  translateMangaText: vi.fn(),
}));

import { POST as handleSummary } from "../summary/route";
import { POST as handleOcr } from "../ocr/route";
import { POST as handleTranslate } from "../translate/route";
import { generateTitleSummary } from "@/server/lib/ai/ai-text-service";
import { performPageOCR } from "@/server/lib/ai/ocr-service";
import { translateMangaText } from "@/server/lib/ai/translation-service";

describe("AI API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/ai/summary", () => {
    it("returns summary result", async () => {
      vi.mocked(generateTitleSummary).mockResolvedValue({
        success: true,
        summary: "Ringkasan cerita",
      });

      const req = new NextRequest("https://yomirra.example/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Manga One", synopsis: "Long synopsis" }),
      });

      const res = await handleSummary(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.summary).toBe("Ringkasan cerita");
    });

    it("rejects request missing title", async () => {
      const req = new NextRequest("https://yomirra.example/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await handleSummary(req);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/ai/ocr", () => {
    it("returns extracted text", async () => {
      vi.mocked(performPageOCR).mockResolvedValue({
        success: true,
        text: "Extracted line",
        lines: ["Extracted line"],
      });

      const req = new NextRequest("https://yomirra.example/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl: "https://example.com/page.jpg" }),
      });

      const res = await handleOcr(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.text).toBe("Extracted line");
    });
  });

  describe("POST /api/ai/translate", () => {
    it("translates text directly", async () => {
      vi.mocked(translateMangaText).mockResolvedValue({
        success: true,
        originalText: "Hello",
        translatedText: "Teks terjemahan",
        targetLanguage: "id",
      });

      const req = new NextRequest("https://yomirra.example/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello", targetLanguage: "id" }),
      });

      const res = await handleTranslate(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.translatedText).toBe("Teks terjemahan");
    });
  });
});
