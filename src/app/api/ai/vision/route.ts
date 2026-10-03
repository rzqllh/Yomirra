import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { analyzeMangaPageVision } from "@/server/lib/ai/vision-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const visionSchema = z.object({
  imageBase64: z.string().max(8 * 1024 * 1024).optional(),
  mimeType: z.string().max(50).optional(),
  imageUrl: z.string().url().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(req, "publicSearch", "ai-vision");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit, {
      unavailableMessage: "Layanan analisis visual sedang padat, silakan coba beberapa saat lagi.",
    });
  }

  try {
    const body = await req.json();
    const parsed = visionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format request tidak valid", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (!parsed.data.imageBase64 && !parsed.data.imageUrl) {
      return NextResponse.json(
        { error: "Salah satu dari imageBase64 atau imageUrl harus disertakan" },
        { status: 400 }
      );
    }

    const response = await analyzeMangaPageVision(parsed.data);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, code: response.code },
        { status: response.code === "AI_UNCONFIGURED" ? 503 : 502 }
      );
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses analisis visual halaman" },
      { status: 500 }
    );
  }
}
