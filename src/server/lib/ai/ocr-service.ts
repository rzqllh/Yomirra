import { isIP } from "node:net";
import { callGeminiGenerateContent, generateAiVision, MAX_IMAGE_SIZE_BYTES } from "./ai-provider";
import { isSafeIp, safeFetch } from "@/server/lib/security/outbound-policy";

export function isSafeImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return false;
    }
    if (isIP(hostname) && !isSafeIp(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export interface ExtractedLine {
  text: string;
}

export interface ExtractMangaPageTextResult {
  success: boolean;
  text?: string;
  lines?: ExtractedLine[];
  error?: string;
}

export async function extractMangaPageText(
  imageUrl: string,
  options?: { maxBytes?: number }
): Promise<ExtractMangaPageTextResult> {
  if (!isSafeImageUrl(imageUrl)) {
    return { success: false, error: "Unsafe or invalid image URL" };
  }

  const maxBytes = options?.maxBytes ?? MAX_IMAGE_SIZE_BYTES;

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return { success: false, error: `Failed to fetch image: HTTP ${res.status}` };
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return { success: false, error: `Image size exceeds limit of ${maxBytes} bytes` };
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      return { success: false, error: `Image size exceeds limit of ${maxBytes} bytes` };
    }

    const mimeType = res.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg";
    const imageBase64 = Buffer.from(buffer).toString("base64");

    const visionRes = await generateAiVision({
      imageBase64,
      mimeType,
      prompt: "Extract dialogue and narrative text from this manga page.",
    });

    if (!visionRes.success || !visionRes.text) {
      return { success: false, error: visionRes.error || "Failed to extract text from page" };
    }

    const lines = visionRes.text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text) => ({ text }));

    return {
      success: true,
      text: visionRes.text,
      lines,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface OCRRequest {
  imageBase64?: string;
  mimeType?: string;
  imageUrl?: string;
}

export interface OCRResponse {
  success: boolean;
  text?: string;
  detectedLanguage?: string;
  lines?: string[];
  error?: string;
  code?: string;
}

/**
 * Extract dialogue and narrative text from a single manga page image.
 */
export async function performPageOCR(
  params: OCRRequest
): Promise<OCRResponse> {
  let base64Data = params.imageBase64;
  let mimeType = params.mimeType || "image/jpeg";

  // If imageUrl provided, fetch with bounded safeFetch
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

  const prompt = `Anda adalah mesin OCR khusus halaman komik / manga / manhwa / manhua.
Tugas Anda:
1. Baca dan ekstrak seluruh teks dialog, balon kata (speech bubbles), efek suara (SFX bila relevan), dan narasi yang ada pada halaman ini.
2. Jangan mengarang atau menambahkan teks yang tidak ada pada gambar.
3. Pertahankan urutan baca alami (kanan ke kiri untuk manga Jepang, atas ke bawah / kiri ke kanan untuk manhwa/webtoon).
4. Kembalikan teks asli sesuai bahasa sumber yang tertulis pada halaman.`;

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

  const rawText = result.text;
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    success: true,
    text: rawText,
    lines,
  };
}
