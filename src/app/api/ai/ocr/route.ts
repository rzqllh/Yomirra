import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { performPageOCR } from "@/server/lib/ai/ocr-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(req, "publicSearch");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = await req.json();
    const { pageUrl, imageBase64, mimeType } = body || {};

    if (!pageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "Salah satu parameter 'pageUrl' atau 'imageBase64' wajib diisi" },
        { status: 400 }
      );
    }

    const result = await performPageOCR({
      imageUrl: pageUrl,
      imageBase64,
      mimeType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Gagal melakukan OCR halaman", code: result.code },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: result.text,
      lines: result.lines,
    });
  } catch {
    return NextResponse.json(
      { error: "Format request tidak valid" },
      { status: 400 }
    );
  }
}
