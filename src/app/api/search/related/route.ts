import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { findRelatedSearchTitles } from "@/server/lib/search/search-intelligence-service";

export const dynamic = "force-dynamic";

const targetSchema = z.object({
  canonicalKey: z.string().min(1).max(500),
  sourceId: z.string().min(1).max(80),
  mangaId: z.string().min(1).max(500),
  title: z.string().min(1).max(300),
  coverUrl: z.string().max(2000).optional(),
  originalTitle: z.string().max(300).optional(),
  alternativeTitles: z.array(z.string().max(300)).max(20).optional(),
  author: z.string().max(300).optional(),
  description: z.string().max(4000).optional(),
  genres: z.array(z.string().max(80)).max(40).optional(),
  format: z.string().max(80).optional(),
  status: z.string().max(80).optional(),
  score: z.number().optional(),
});

const bodySchema = z.object({
  target: targetSchema,
  limit: z.number().int().min(1).max(12).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: { message: "Too Many Requests" } },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Invalid related-title payload" } },
      { status: 400 }
    );
  }

  const results = await findRelatedSearchTitles(
    parsed.data.target,
    parsed.data.limit ?? 8
  );
  return NextResponse.json({ data: results });
}
