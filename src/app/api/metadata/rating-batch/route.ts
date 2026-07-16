import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/server/lib/cache/redis-cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const titles: string[] = body.titles;

    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ error: "Missing or invalid titles array" }, { status: 400 });
    }

    const results: Record<string, number | undefined> = {};
    const uniqueTitles = Array.from(new Set(titles)).filter(Boolean);

    await Promise.all(
      uniqueTitles.map(async (title) => {
        const normalizedTitle = title
          .replace(/chapter\s*\d+/i, "")
          .replace(/\[.*?\]/g, "")
          .replace(/\(.*?\)/g, "")
          .trim();

        if (!normalizedTitle) {
          results[title] = undefined;
          return;
        }

        const cacheKey = `rating:score:v2:${normalizedTitle.toLowerCase()}`;

        try {
          const cachedData = await withCache(
            cacheKey,
            async () => {
              // 1. Try MangaDex First
              try {
                // Find manga by title
                const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(normalizedTitle)}&limit=1`, {
                  signal: AbortSignal.timeout(5000),
                });
                
                if (searchRes.ok) {
                  const searchJson = await searchRes.json();
                  if (searchJson.data && searchJson.data.length > 0) {
                    const mangaId = searchJson.data[0].id;
                    
                    // Fetch statistics for rating
                    const statRes = await fetch(`https://api.mangadex.org/statistics/manga/${mangaId}`, {
                      signal: AbortSignal.timeout(5000),
                    });
                    
                    if (statRes.ok) {
                      const statJson = await statRes.json();
                      const stats = statJson.statistics[mangaId];
                      const rating = stats?.rating?.bayesian || stats?.rating?.average;
                      
                      if (typeof rating === "number") {
                        // MangaDex rating is already out of 10
                        return { score: Number(rating.toFixed(1)) };
                      }
                    }
                  }
                }
              } catch (e) {
                console.error("MangaDex rating fetch error:", e);
              }

              // 2. Fallback to Anilist
              try {
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
                    "User-Agent": "Yomirra/1.0"
                  },
                  body: JSON.stringify({ query, variables: { search: normalizedTitle } }),
                  signal: AbortSignal.timeout(5000),
                });

                if (res.ok) {
                  const json = await res.json();
                  const averageScore = json?.data?.Media?.averageScore;
                  
                  if (typeof averageScore === "number") {
                    return { score: Number((averageScore / 10).toFixed(1)) };
                  }
                }
              } catch (e) {
                console.error("Anilist fallback error:", e);
              }

              return { score: undefined };
            },
            60 * 60 * 24 * 7 // 7 days
          );

          results[title] = cachedData?.score;
        } catch (error) {
          console.error(`Rating batch score error for ${title}:`, error);
          results[title] = undefined;
        }
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Rating batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
