import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/lib/security/rate-limit";
import { rankSearchIntelligence } from "@/server/lib/search/search-intelligence-service";

export const dynamic = "force-dynamic";

const bindingSchema = z.object({
  sourceId: z.string().min(1).max(80),
  mangaId: z.string().min(1).max(500),
  title: z.string().min(1).max(300),
  coverUrl: z.string().max(2000).optional(),
  latestChapter: z.string().max(200).optional(),
  language: z.string().max(32).optional(),
  format: z.string().max(80).optional(),
  score: z.union([z.number(), z.string()]).optional(),
});

const candidateSchema = z.object({
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
  sourceBindings: z.array(bindingSchema).max(20).optional(),
});

const tagSchema = z.object({
  raw: z.string().max(100),
  id: z.string().max(100),
  label: z.string().max(100),
  category: z.enum(["genre", "format", "status"]),
  confidence: z.number().min(0).max(1),
});

const bodySchema = z.object({
  query: z.string().max(300),
  tags: z.array(tagSchema).max(12).default([]),
  candidates: z.array(candidateSchema).max(40).default([]),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 10, 60, true, "search-intelligence");
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: {
          message: rateLimit.unavailable
            ? "Search intelligence temporarily unavailable"
            : "Too Many Requests",
        },
      },
      { status: rateLimit.unavailable ? 503 : 429, headers: rateLimit.headers }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Invalid search intelligence payload" } },
      { status: 400 }
    );
  }

  const result = await rankSearchIntelligence(parsed.data);
  return NextResponse.json({ data: result });
}
