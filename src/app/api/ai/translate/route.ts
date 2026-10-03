import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { translateMangaText } from "@/server/lib/ai/translation-service";
import { performPageOCR } from "@/server/lib/ai/ocr-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(req, "publicSearch");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = await req.json();
    const { text, pageUrl, targetLanguage = "id", sourceLanguage } = body || {};

    if (pageUrl) {
      const ocrResult = await performPageOCR({ imageUrl: pageUrl });
      if (!ocrResult.success || !ocrResult.text) {
        return NextResponse.json(
          {
            error: ocrResult.error || "Gagal melakukan OCR halaman",
            stageFailed: "ocr",
            code: ocrResult.code,
          },
          { status: 422 }
        );
      }

      const transResult = await translateMangaText({
        text: ocrResult.text,
        targetLanguage,
        sourceLanguage,
      });

      if (!transResult.success) {
        return NextResponse.json(
          {
            error: transResult.error || "Gagal menerjemahkan teks halaman",
            stageFailed: "translation",
            sourceText: ocrResult.text,
            code: transResult.code,
          },
          { status: 422 }
        );
      }

      return NextResponse.json(transResult);
    }

    if (text && typeof text === "string") {
      const result = await translateMangaText({
        text,
        targetLanguage,
        sourceLanguage,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Gagal menerjemahkan teks", code: result.code },
          { status: 422 }
        );
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Salah satu parameter 'text' atau 'pageUrl' wajib diisi" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Format request tidak valid" },
      { status: 400 }
    );
  }
}
