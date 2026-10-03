import { callGeminiGenerateContent, MAX_IMAGE_SIZE_BYTES } from "./ai-provider";
import { safeFetch } from "@/server/lib/security/outbound-policy";

export interface VisionAnalysisRequest {
  imageBase64?: string;
  mimeType?: string;
  imageUrl?: string;
}

export interface PanelBox {
  id: number;
  description?: string;
}

export interface VisionAnalysisResponse {
  success: boolean;
  readingDirection?: "rtl" | "ltr" | "vertical";
  detectedBubblesCount?: number;
  summary?: string;
  panels?: PanelBox[];
  error?: string;
  code?: string;
}

/**
 * Perform vision layout analysis on a single manga page to assist reader flow.
 */
export async function analyzeMangaPageVision(
  params: VisionAnalysisRequest
): Promise<VisionAnalysisResponse> {
  let base64Data = params.imageBase64;
  let mimeType = params.mimeType || "image/jpeg";

  if (!base64Data && params.imageUrl) {
    try {
      const res = await safeFetch(params.imageUrl, {
        signal: AbortSignal.timeout(8000),
        maxSize: MAX_IMAGE_SIZE_BYTES,
      });

      if (!res.ok) {
        return {
          success: false,
          code: "IMAGE_FETCH_FAILED",
          error: `Gagal mengunduh gambar halaman (HTTP ${res.status}).`,
        };
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.startsWith("image/")) {
        mimeType = contentType.split(";")[0].trim();
      }

      const buffer = await res.arrayBuffer();
      base64Data = Buffer.from(buffer).toString("base64");
    } catch {
      return {
        success: false,
        code: "IMAGE_FETCH_FAILED",
        error: "Gagal mengambil gambar dari tautan yang diberikan.",
      };
    }
  }

  if (!base64Data) {
    return {
      success: false,
      code: "MISSING_IMAGE",
      error: "Data gambar halaman manga wajib disertakan.",
    };
  }

  const prompt = `Anda adalah asisten analisis visual tata letak halaman komik.
Analisis halaman ini dan kembalikan JSON persis dalam format berikut tanpa markdown tambahan:
{
  "readingDirection": "rtl" (untuk manga Jepang) atau "ltr" (untuk komik barat) atau "vertical" (untuk manhwa/webtoon strip),
  "detectedBubblesCount": <estimasi jumlah balon kata/dialog>,
  "summary": "<deskripsi singkat visual komposisi halaman, maksimal 1 kalimat>"
}`;

  const result = await callGeminiGenerateContent([
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    { text: prompt },
  ]);

  if ("error" in result) {
    return {
      success: false,
      code: result.error.code,
      error: result.error.message,
    };
  }

  try {
    const raw = result.text.replace(/```(?:json)?/gi, "").trim();
    const parsed = JSON.parse(raw);

    return {
      success: true,
      readingDirection: ["rtl", "ltr", "vertical"].includes(parsed.readingDirection)
        ? parsed.readingDirection
        : "rtl",
      detectedBubblesCount: typeof parsed.detectedBubblesCount === "number" ? parsed.detectedBubblesCount : 0,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch {
    // If model didn't return strict JSON, return structured fallback safely
    return {
      success: true,
      readingDirection: "rtl",
      summary: result.text.slice(0, 150),
    };
  }
}
