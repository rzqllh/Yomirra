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

    // Deduplicate and filter empty
    const uniqueTitles = Array.from(new Set(titles)).filter(Boolean);

    // We process them in parallel but if they all miss cache, we might hit Anilist rate limit.
    // However, most will hit cache. We can use Promise.all.
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

        const cacheKey = `anilist:score:${normalizedTitle.toLowerCase()}`;

        try {
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
                  "User-Agent": "Yomirra/1.0"
                },
                body: JSON.stringify({ query, variables: { search: normalizedTitle } }),
                signal: AbortSignal.timeout(5000),
              });

              if (!res.ok) {
                if (res.status === 429) {
                  console.warn("Anilist API Rate Limited");
                }
                return { score: undefined };
              }

              const json = await res.json();
              const averageScore = json?.data?.Media?.averageScore;
              
              if (typeof averageScore === "number") {
                return { score: Number((averageScore / 10).toFixed(1)) };
              }

              return { score: undefined };
            },
            60 * 60 * 24 * 7 // 7 days
          );

          results[title] = cachedData?.score;
        } catch (error) {
          console.error(`Anilist batch score error for ${title}:`, error);
          results[title] = undefined;
        }
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Anilist score batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
