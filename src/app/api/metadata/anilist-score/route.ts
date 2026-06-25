import { NextRequest, NextResponse } from "next/server";
import { withCache, CACHE_TTL } from "@/server/lib/cache/redis-cache";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  try {
    // Normalize title to improve match rate (e.g., remove "Chapter X", brackets, extra spaces)
    const normalizedTitle = title
      .replace(/chapter\s*\d+/i, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .trim();

    if (!normalizedTitle) {
      return NextResponse.json({ data: { score: undefined } });
    }

    const cacheKey = `anilist:score:${normalizedTitle.toLowerCase()}`;

    const cachedData = await withCache(
      cacheKey,
      async () => {
        const query = `
          query ($search: String) {
            Media (search: $search, type: MANGA) {
              averageScore
            }
          }
        `;
        
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            // Need a unique user agent for Anilist to prevent broad blocks
            "User-Agent": "Yomirra/1.0"
          },
          body: JSON.stringify({ query, variables: { search: normalizedTitle } }),
          // Timeout to avoid hanging requests
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          if (res.status === 429) {
            console.warn("Anilist API Rate Limited");
          }
          return { score: undefined };
        }

        const json = await res.json();
        
        // Anilist score is 0-100, we want 0.0-10.0
        const averageScore = json?.data?.Media?.averageScore;
        
        if (typeof averageScore === "number") {
          return { score: Number((averageScore / 10).toFixed(1)) };
        }

        return { score: undefined };
      },
      // Cache for 7 days since ratings don't change that rapidly
      60 * 60 * 24 * 7 
    );

    return NextResponse.json({ data: cachedData });
  } catch (error) {
    console.error("Anilist score error:", error);
    // Return undefined score instead of 500 so UI doesn't break
    return NextResponse.json({ data: { score: undefined } });
  }
}
