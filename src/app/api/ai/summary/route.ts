import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitPolicy, createRateLimitRejection } from "@/server/lib/security/rate-limit";
import { generateTitleSummary } from "@/server/lib/ai/ai-text-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(req, "publicSearch");
  if (!rateLimit.success) {
    return createRateLimitRejection(rateLimit);
  }

  try {
    const body = await req.json();
    const { title, synopsis, genres, language } = body || {};

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Parameter 'title' wajib diisi" },
        { status: 400 }
      );
    }

    const result = await generateTitleSummary({
      title,
      synopsis,
      genres,
      language,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Gagal menghasilkan ringkasan AI", code: result.code },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
    });
  } catch {
    return NextResponse.json(
      { error: "Format request tidak valid" },
      { status: 400 }
    );
  }
}
